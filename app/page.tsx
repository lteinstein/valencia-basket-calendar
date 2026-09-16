'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Formulario asistente
  const [nombreAsistente, setNombreAsistente] = useState('');

  // Modal nuevo partido
  const [showModal, setShowModal] = useState(false);
  const [rival, setRival] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('20:30');
  const [lugar, setLugar] = useState('La Fonteta');
  const [condicion, setCondicion] = useState('Local');

  const [mensaje, setMensaje] = useState<{ tipo: string; texto: string } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const resPartidos = await supabase.from('partidos').select('*');
      const resAsistentes = await supabase.from('asistentes').select('*');

      if (resPartidos.data) setPartidos(resPartidos.data);
      if (resAsistentes.data) setAsistentes(resAsistentes.data);
    } catch (err) {
      console.error('Error al cargar:', err);
    } finally {
      setLoading(false);
    }
  }

  // Guardar nuevo partido
  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rival || !fecha) {
      setMensaje({ tipo: 'error', texto: 'El rival y la fecha son obligatorios.' });
      return;
    }

    try {
      const { error } = await supabase.from('partidos').insert([
        { rival, fecha, hora, lugar, condicion }
      ]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Partido publicado y marcado en el calendario!' });
      setSelectedDate(fecha);
      setRival('');
      setFecha('');
      setShowModal(false);
      await cargarDatos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al publicar: ${err.message}` });
    }
  };

  // Borrar partido
  const handleBorrarPartido = async (id: string) => {
    if (!confirm('¿Seguro que quieres borrar este partido?')) return;
    try {
      await supabase.from('partidos').delete().eq('id', id);
      await cargarDatos();
      setSelectedDate(null);
    } catch (err: any) {
      alert(`Error al borrar: ${err.message}`);
    }
  };

  // Añadir asistente
  const handleAnadirAsistente = async (partidoId: string) => {
    if (!nombreAsistente.trim()) return;
    try {
      const { error } = await supabase.from('asistentes').insert([
        { nombre: nombreAsistente.trim(), partido_id: partidoId }
      ]);
      if (error) throw error;
      setNombreAsistente('');
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al añadir asistente: ${err.message}`);
    }
  };

  // Borrar asistente
  const handleBorrarAsistente = async (id: string) => {
    try {
      await supabase.from('asistentes').delete().eq('id', id);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al borrar asistente: ${err.message}`);
    }
  };

  // Filtrar partidos por fecha seleccionada
  const partidosMap = partidos.reduce((acc, p) => {
    if (!p.fecha) return acc;
    const key = p.fecha.substring(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getDiasMes = (mesIndex: number, anyNum: number) => {
    const dias = [];
    const primerDia = new Date(anyNum, mesIndex, 1);
    const ultimoDia = new Date(anyNum, mesIndex + 1, 0);

    let inicio = primerDia.getDay() - 1;
    if (inicio === -1) inicio = 6;

    for (let i = 0; i < inicio; i++) dias.push(null);
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const mStr = String(mesIndex + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      dias.push({ day: d, dateKey: `${anyNum}-${mStr}-${dStr}` });
    }
    return dias;
  };

  const partidosDelDia = selectedDate ? partidosMap[selectedDate] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center w-full max-w-7xl flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-black text-orange-500 tracking-wider">
          VALENCIA BASKET
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Calendario Oficial y Gestión de Asistencia
        </p>

        <div className="flex flex-wrap items-center justify-between w-full mt-6 gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 mx-auto md:mx-0">
            <button onClick={() => setYear(year - 1)} className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm">
              ← {year - 1}
            </button>
            <span className="text-2xl font-extrabold text-white">{year}</span>
            <button onClick={() => setYear(year + 1)} className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm">
              {year + 1} →
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedDate) setFecha(selectedDate);
              setShowModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 mx-auto md:mx-0"
          >
            + Añadir Partido
          </button>
        </div>
      </header>

      {mensaje && (
        <div className={`w-full max-w-7xl mb-6 p-3 rounded-xl text-center font-semibold text-sm ${mensaje.tipo === 'exito' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          {mensaje.texto}
        </div>
      )}

      {loading ? (
        <div className="text-orange-400 font-medium my-16 animate-pulse text-lg">Cargando partidos...</div>
      ) : (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CALENDARIO */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            {meses.map((mes, mesIdx) => {
              const dias = getDiasMes(mesIdx, year);
              return (
                <div key={mes} className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-md">
                  <h3 className="text-center font-bold text-orange-400 mb-3 border-b border-slate-800 pb-1.5 text-sm uppercase">
                    {mes}
                  </h3>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
                    <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {dias.map((item, idx) => {
                      if (!item) return <div key={`empty-${idx}`} className="h-7" />;
                      const tienePartido = partidosMap[item.dateKey] && partidosMap[item.dateKey].length > 0;
                      const isSelected = selectedDate === item.dateKey;

                      return (
                        <button
                          key={item.dateKey}
                          onClick={() => setSelectedDate(item.dateKey)}
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
                            <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANEL DETALLES Y ASISTENTES */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
                Información del Día
              </h2>

              {selectedDate ? (
                partidosDelDia && partidosDelDia.length > 0 ? (
                  <div className="space-y-6">
                    {partidosDelDia.map((partido: any) => {
                      const listaAsistentes = asistentes.filter((a) => a.partido_id === partido.id);

                      return (
                        <div key={partido.id} className="space-y-4 border-b border-slate-800 pb-6 last:border-0">
                          {/* Tarjeta partido */}
                          <div className="bg-slate-800/80 p-4 rounded-xl border border-orange-500/30 relative space-y-2">
                            <button
                              onClick={() => handleBorrarPartido(partido.id)}
                              className="absolute top-3 right-3 text-xs bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-2 py-1 rounded transition-colors"
                            >
                              Borrar
                            </button>

                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase bg-orange-500/10 text-orange-400 border-orange-500/30">
                              {partido.condicion || 'Local'}
                            </span>
                            <h3 className="text-xl font-black text-white">vs {partido.rival}</h3>
                            <div className="text-xs text-slate-300 space-y-1">
                              <p>📅 Fecha: <span className="text-white font-semibold">{partido.fecha.substring(0, 10)}</span></p>
                              <p>⏰ Hora: <span className="text-white font-semibold">{partido.hora}</span></p>
                              <p>📍 Lugar: <span className="text-white font-semibold">{partido.lugar}</span></p>
                            </div>
                          </div>

                          {/* Apartado Asistentes */}
                          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
                            <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                              <span>¿Quién va a ir?</span>
                              <span className="text-xs bg-slate-800 text-orange-400 px-2 py-0.5 rounded-full border border-slate-700">
                                {listaAsistentes.length}
                              </span>
                            </h4>

                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Tu nombre..."
                                value={nombreAsistente}
                                onChange={(e) => setNombreAsistente(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                              />
                              <button
                                onClick={() => handleAnadirAsistente(partido.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm transition-all"
                              >
                                Apuntar
                              </button>
                            </div>

                            {listaAsistentes.length > 0 ? (
                              <ul className="space-y-1.5 max-h-40 overflow-y-auto pt-2">
                                {listaAsistentes.map((asistente: any) => (
                                  <li key={asistente.id} className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                      <span>{asistente.nombre}</span>
                                    </div>
                                    <button onClick={() => handleBorrarAsistente(asistente.id)} className="text-slate-500 hover:text-red-400">✕</button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-500 text-xs italic text-center py-2">Nadie se ha apuntado todavía.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm mb-4">No hay partidos el {selectedDate}.</p>
                    <button
                      onClick={() => {
                        setFecha(selectedDate);
                        setShowModal(true);
                      }}
                      className="bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 font-semibold px-4 py-2 rounded-lg text-xs"
                    >
                      + Añadir partido este día
                    </button>
                  </div>
                )
              ) : (
                <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm px-4">Selecciona un día en el calendario para ver la información y los asistentes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-orange-400">Añadir Nuevo Partido</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCrearPartido} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rival:</label>
                <input type="text" placeholder="ej. Real Madrid" value={rival} onChange={(e) => setRival(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha:</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Condición:</label>
                  <select value={condicion} onChange={(e) => setCondicion(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="Local">Local</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Hora:</label>
                  <input type="text" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Lugar:</label>
                  <input type="text" value={lugar} onChange={(e) => setLugar(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm">Guardar y Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}