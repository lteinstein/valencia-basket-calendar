'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Asistente {
  id: string;
  nombre: string;
  partido_id?: string;
}

interface Partido {
  id: string;
  rival: string;
  fecha: string; // Formato YYYY-MM-DD
  hora?: string;
  lugar?: string;
  condicion?: 'Local' | 'Visitante';
  asistentes?: Asistente[];
}

export default function Home() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Estados para Asistentes
  const [nombreAsistente, setNombreAsistente] = useState<string>('');
  const [guardandoAsistente, setGuardandoAsistente] = useState<boolean>(false);

  // Estados para Nuevo Partido
  const [showModalNuevoPartido, setShowModalNuevoPartido] = useState<boolean>(false);
  const [nuevoRival, setNuevoRival] = useState<string>('');
  const [nuevaFecha, setNuevaFecha] = useState<string>('');
  const [nuevaHora, setNuevaHora] = useState<string>('20:30');
  const [nuevoLugar, setNuevoLugar] = useState<string>('La Fonteta');
  const [nuevaCondicion, setNuevaCondicion] = useState<'Local' | 'Visitante'>('Local');
  const [guardandoPartido, setGuardandoPartido] = useState<boolean>(false);

  // Notificaciones
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Selector de año
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchPartidos();
  }, []);

  async function fetchPartidos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          id,
          rival,
          fecha,
          hora,
          lugar,
          condicion,
          asistentes (
            id,
            nombre,
            partido_id
          )
        `);

      if (error) {
        const { data: partidosSimples } = await supabase.from('partidos').select('*');
        if (partidosSimples) setPartidos(partidosSimples as Partido[]);
      } else if (data) {
        setPartidos(data as Partido[]);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- ASISTENCIAS ---
  const handleAgregarAsistente = async (partidoId: string) => {
    if (!nombreAsistente.trim()) {
      setMensaje({ tipo: 'error', texto: 'Escribe tu nombre para confirmar la asistencia.' });
      return;
    }
    setGuardandoAsistente(true);
    setMensaje(null);

    try {
      const { error } = await supabase
        .from('asistentes')
        .insert([{ nombre: nombreAsistente.trim(), partido_id: partidoId }]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Asistencia confirmada!' });
      setNombreAsistente('');
      await fetchPartidos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar asistencia.' });
    } finally {
      setGuardandoAsistente(false);
    }
  };

  const handleEliminarAsistente = async (asistenteId: string) => {
    if (!confirm('¿Borrar esta asistencia?')) return;

    try {
      const { error } = await supabase.from('asistentes').delete().eq('id', asistenteId);
      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: 'Asistencia eliminada.' });
      await fetchPartidos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al eliminar asistencia.' });
    }
  };

  // --- CREAR Y BORRAR PARTIDOS ---
  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRival.trim() || !nuevaFecha) {
      setMensaje({ tipo: 'error', texto: 'Indica el rival y la fecha del partido.' });
      return;
    }

    setGuardandoPartido(true);
    setMensaje(null);

    try {
      const { error } = await supabase.from('partidos').insert([
        {
          rival: nuevoRival.trim(),
          fecha: nuevaFecha,
          hora: nuevaHora,
          lugar: nuevoLugar,
          condicion: nuevaCondicion
        },
      ]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Partido añadido! El día ya destaca en el calendario para todos.' });
      setSelectedDate(nuevaFecha);
      setNuevoRival('');
      setNuevaFecha('');
      setShowModalNuevoPartido(false);
      await fetchPartidos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el partido en la base de datos.' });
    } finally {
      setGuardandoPartido(false);
    }
  };

  const handleEliminarPartido = async (partidoId: string) => {
    if (!confirm('¿Eliminar este partido y la lista de asistentes?')) return;

    try {
      await supabase.from('asistentes').delete().eq('partido_id', partidoId);
      const { error } = await supabase.from('partidos').delete().eq('id', partidoId);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: 'Partido eliminado correctamente.' });
      await fetchPartidos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al borrar el partido.' });
    }
  };

  // Mapeo por fecha (YYYY-MM-DD)
  const partidosMap = partidos.reduce((acc, partido) => {
    if (!partido.fecha) return acc;
    const dateKey = partido.fecha.substring(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(partido);
    return acc;
  }, {} as Record<string, Partido[]>);

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (monthIndex: number, yearNum: number) => {
    const days = [];
    const firstDay = new Date(yearNum, monthIndex, 1);
    const lastDay = new Date(yearNum, monthIndex + 1, 0);

    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    for (let i = 0; i < startingDay; i++) days.push(null);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const monthFormatted = String(monthIndex + 1).padStart(2, '0');
      const dayFormatted = String(day).padStart(2, '0');
      const dateKey = `${yearNum}-${monthFormatted}-${dayFormatted}`;
      days.push({ day, dateKey });
    }
    return days;
  };

  const partidosDelDia = selectedDate ? partidosMap[selectedDate] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center">
      {/* CABECERA */}
      <header className="mb-8 text-center w-full max-w-7xl flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-black text-orange-500 tracking-wider">
          VALENCIA BASKET
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Calendario Oficial, Control de Partidos y Asistencia
        </p>

        <div className="flex flex-wrap items-center justify-between w-full mt-6 gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 mx-auto md:mx-0">
            <button
              onClick={() => setYear(year - 1)}
              className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm"
            >
              ← {year - 1}
            </button>
            <span className="text-2xl font-extrabold text-white">{year}</span>
            <button
              onClick={() => setYear(year + 1)}
              className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm"
            >
              {year + 1} →
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedDate) setNuevaFecha(selectedDate);
              setShowModalNuevoPartido(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 mx-auto md:mx-0"
          >
            + Añadir Partido
          </button>
        </div>
      </header>

      {/* NOTIFICACIONES */}
      {mensaje && (
        <div
          className={`w-full max-w-7xl mb-6 p-3 rounded-xl text-center font-semibold text-sm ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {loading ? (
        <div className="text-orange-400 font-medium my-16 animate-pulse text-lg">
          Cargando partidos...
        </div>
      ) : (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* VISTA CALENDARIO ANUAL */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            {nombresMeses.map((mes, monthIndex) => {
              const days = getDaysInMonth(monthIndex, year);

              return (
                <div key={mes} className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-md">
                  <h3 className="text-center font-bold text-orange-400 mb-3 border-b border-slate-800 pb-1.5 text-sm uppercase">
                    {mes}
                  </h3>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
                    <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {days.map((item, idx) => {
                      if (!item) return <div key={`empty-${idx}`} className="h-7" />;

                      const tienePartido = partidosMap[item.dateKey] && partidosMap[item.dateKey].length > 0;
                      const isSelected = selectedDate === item.dateKey;

                      return (
                        <button
                          key={item.dateKey}
                          onClick={() => {
                            setSelectedDate(item.dateKey);
                            setMensaje(null);
                          }}
                          className={`h-7 w-full rounded-md text-xs font-semibold flex items-center justify-center transition-all relative ${
                            isSelected
                              ? 'bg-orange-500 text-white ring-2 ring-orange-300 font-bold scale-105 z-10'
                              : tienePartido
                              ? 'bg-orange-500/30 text-orange-300 border border-orange-500/60 hover:bg-orange-500/50 font-bold'
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {item.day}
                          {tienePartido && !isSelected && (
                            <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-sm shadow-orange-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANEL LATERAL DE INFORMACIÓN */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
                Información del Partido
              </h2>

              {selectedDate ? (
                partidosDelDia && partidosDelDia.length > 0 ? (
                  <div className="space-y-6">
                    {partidosDelDia.map((partido) => (
                      <div key={partido.id} className="space-y-5">
                        
                        {/* TARJETA DETALLE DEL PARTIDO */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-orange-500/30 relative space-y-2">
                          <button
                            onClick={() => handleEliminarPartido(partido.id)}
                            className="absolute top-3 right-3 text-xs bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-2 py-1 rounded transition-colors"
                            title="Borrar partido"
                          >
                            Eliminar
                          </button>

                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              partido.condicion === 'Visitante'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            }`}>
                              {partido.condicion || 'Local'}
                            </span>
                          </div>

                          <h3 className="text-2xl font-black text-white">vs {partido.rival}</h3>
                          
                          <div className="text-xs text-slate-300 space-y-1 pt-1">
                            <p>📅 <span className="text-slate-400">Fecha:</span> <span className="text-white font-semibold">{partido.fecha.substring(0, 10)}</span></p>
                            {partido.hora && <p>⏰ <span className="text-slate-400">Hora:</span> <span className="text-white font-semibold">{partido.hora}</span></p>}
                            {partido.lugar && <p>📍 <span className="text-slate-400">Lugar:</span> <span className="text-white font-semibold">{partido.lugar}</span></p>}
                          </div>
                        </div>

                        {/* REGISTRO DE ASISTENCIA */}
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
                          <h4 className="text-sm font-bold text-slate-200">Añadir asistente</h4>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tu nombre..."
                              value={nombreAsistente}
                              onChange={(e) => setNombreAsistente(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                            <button
                              onClick={() => handleAgregarAsistente(partido.id)}
                              disabled={guardandoAsistente}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-all shadow-md shadow-orange-500/20"
                            >
                              {guardandoAsistente ? 'Guardando...' : 'Confirmar Asistencia'}
                            </button>
                          </div>
                        </div>

                        {/* LISTA DE ASISTENTES */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                            <span>Asistentes Confirmados:</span>
                            <span className="text-xs bg-slate-800 text-orange-400 px-2 py-0.5 rounded-full border border-slate-700 font-bold">
                              {partido.asistentes ? partido.asistentes.length : 0}
                            </span>
                          </h4>

                          {partido.asistentes && partido.asistentes.length > 0 ? (
                            <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {partido.asistentes.map((asistente) => (
                                <li
                                  key={asistente.id}
                                  className="bg-slate-800/50 border border-slate-700/60 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-100 flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span>{asistente.nombre}</span>
                                  </div>
                                  <button
                                    onClick={() => handleEliminarAsistente(asistente.id)}
                                    className="text-xs text-slate-500 hover:text-red-400 p-1 transition-colors"
                                    title="Quitar de la lista"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 text-xs italic bg-slate-800/30 p-3 rounded-lg border border-slate-800 text-center">
                              Aún no hay personas anotadas para este partido.
                            </p>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm mb-4">No hay partidos programados el <span className="font-bold text-slate-300">{selectedDate}</span>.</p>
                    <button
                      onClick={() => {
                        setNuevaFecha(selectedDate);
                        setShowModalNuevoPartido(true);
                      }}
                      className="bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 font-semibold px-4 py-2 rounded-lg text-xs"
                    >
                      + Crear Partido este día
                    </button>
                  </div>
                )
              ) : (
                <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm px-4">
                    Selecciona cualquier día en <span className="text-orange-400 font-bold">naranja</span> para ver detalles, si es local/visitante, la hora y los asistentes.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL PARA AÑADIR NUEVO PARTIDO */}
      {showModalNuevoPartido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-orange-400">Añadir Nuevo Partido</h3>
              <button onClick={() => setShowModalNuevoPartido(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCrearPartido} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rival:</label>
                <input
                  type="text"
                  placeholder="ej. Real Madrid, FC Barcelona..."
                  value={nuevoRival}
                  onChange={(e) => setNuevoRival(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Condición:</label>
                  <select
                    value={nuevaCondicion}
                    onChange={(e) => setNuevaCondicion(e.target.value as 'Local' | 'Visitante')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Local">Local</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Hora:</label>
                  <input
                    type="text"
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Lugar:</label>
                  <input
                    type="text"
                    value={nuevoLugar}
                    onChange={(e) => setNuevoLugar(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNuevoPartido(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPartido}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm"
                >
                  {guardandoPartido ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}