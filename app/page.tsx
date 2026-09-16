'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicialización del cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Asistente {
  id?: string;
  nombre: string;
  partido_id?: string;
}

interface Partido {
  id: string;
  rival: string;
  fecha: string; // Formato YYYY-MM-DD
  hora?: string;
  lugar?: string;
  asistentes?: Asistente[];
}

export default function Home() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Estado para el nombre del nuevo asistente
  const [nombreAsistente, setNombreAsistente] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Año seleccionado para el calendario
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchPartidos();
  }, []);

  async function fetchPartidos() {
    setLoading(true);
    try {
      // Consulta con join a la tabla de asistentes
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          id,
          rival,
          fecha,
          hora,
          lugar,
          asistentes (
            id,
            nombre,
            partido_id
          )
        `);

      if (error) {
        // Consulta alternativa si la relación directa no está definida
        const { data: partidosSimples } = await supabase
          .from('partidos')
          .select('*');
        if (partidosSimples) {
          setPartidos(partidosSimples as Partido[]);
        }
      } else if (data) {
        setPartidos(data as Partido[]);
      }
    } catch (err) {
      console.error('Error al cargar la información:', err);
    } finally {
      setLoading(false);
    }
  }

  // Función para registrar la asistencia a Supabase
  const handleAgregarAsistente = async (partidoId: string) => {
    if (!nombreAsistente.trim()) {
      setMensaje({ tipo: 'error', texto: 'Por favor, escribe tu nombre.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const { error } = await supabase
        .from('asistentes')
        .insert([
          {
            nombre: nombreAsistente.trim(),
            partido_id: partidoId
          }
        ]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Asistencia confirmada con éxito!' });
      setNombreAsistente('');
      // Recargar la lista de partidos y asistentes
      await fetchPartidos();
    } catch (err: any) {
      console.error('Error al registrar asistencia:', err);
      setMensaje({ 
        tipo: 'error', 
        texto: err.message || 'Ocurrió un error al guardar. Inténtalo de nuevo.' 
      });
    } finally {
      setGuardando(false);
    }
  };

  // Mapeo de partidos por fecha en texto (YYYY-MM-DD)
  const partidosMap = partidos.reduce((acc, partido) => {
    if (!partido.fecha) return acc;
    const dateKey = partido.fecha.substring(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(partido);
    return acc;
  }, {} as Record<string, Partido[]>);

  // Lista de meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper para generar los días del mes
  const getDaysInMonth = (monthIndex: number, yearNum: number) => {
    const days = [];
    const firstDay = new Date(yearNum, monthIndex, 1);
    const lastDay = new Date(yearNum, monthIndex + 1, 0);

    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

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
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-orange-500 tracking-wider">
          VALENCIA BASKET
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Calendario Anual de Partidos y Confirmación de Asistencia
        </p>

        {/* SELECTOR DE AÑO */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button
            onClick={() => setYear(year - 1)}
            className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm transition-colors"
          >
            ← {year - 1}
          </button>
          <span className="text-2xl font-extrabold text-white">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-sm transition-colors"
          >
            {year + 1} →
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-orange-400 font-medium my-16 animate-pulse text-lg">
          Cargando partidos de la temporada...
        </div>
      ) : (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CUADRÍCULA DEL CALENDARIO ANUAL */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            {nombresMeses.map((mes, monthIndex) => {
              const days = getDaysInMonth(monthIndex, year);

              return (
                <div
                  key={mes}
                  className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-md"
                >
                  <h3 className="text-center font-bold text-orange-400 mb-3 border-b border-slate-800 pb-1.5 text-sm uppercase tracking-wider">
                    {mes}
                  </h3>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
                    <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {days.map((item, idx) => {
                      if (!item) {
                        return <div key={`empty-${idx}`} className="h-7" />;
                      }

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
                            <span className="absolute bottom-0.5 w-1 h-1 bg-orange-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANEL LATERAL: DETALLES, BOTÓN DE ASISTIR Y LISTA DE ASISTENTES */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
                Detalles y Asistencia
              </h2>

              {selectedDate ? (
                partidosDelDia && partidosDelDia.length > 0 ? (
                  <div className="space-y-6">
                    {partidosDelDia.map((partido) => (
                      <div key={partido.id} className="space-y-5">
                        {/* Detalle del partido */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-orange-500/30">
                          <span className="text-xs font-extrabold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 uppercase tracking-wider">
                            Partido Programado
                          </span>
                          <h3 className="text-xl font-black text-white mt-2">vs {partido.rival}</h3>
                          <p className="text-xs text-slate-300 mt-2">
                            📅 Fecha: <span className="text-white font-medium">{partido.fecha.substring(0, 10)}</span>
                          </p>
                          {partido.hora && (
                            <p className="text-xs text-slate-300 mt-1">
                              ⏰ Hora: <span className="text-white font-medium">{partido.hora}</span>
                            </p>
                          )}
                          {partido.lugar && (
                            <p className="text-xs text-slate-300 mt-1">
                              📍 Lugar: <span className="text-white font-medium">{partido.lugar}</span>
                            </p>
                          )}
                        </div>

                        {/* FORMULARIO PARA CONFIRMAR ASISTENCIA */}
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
                          <h4 className="text-sm font-bold text-slate-200">
                            ¿Vas a ir a este partido?
                          </h4>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Escribe tu nombre..."
                              value={nombreAsistente}
                              onChange={(e) => setNombreAsistente(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                            <button
                              onClick={() => handleAgregarAsistente(partido.id)}
                              disabled={guardando}
                              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-2 rounded-lg text-sm transition-all shadow-md shadow-orange-500/20 active:scale-[0.98]"
                            >
                              {guardando ? 'Guardando...' : 'Confirmar Asistencia'}
                            </button>
                          </div>

                          {mensaje && (
                            <p
                              className={`text-xs p-2 rounded-lg text-center font-medium ${
                                mensaje.tipo === 'exito'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {mensaje.texto}
                            </p>
                          )}
                        </div>

                        {/* LISTA DE ASISTENTES CONFIRMADOS */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                            <span>Asistentes Confirmados:</span>
                            <span className="text-xs bg-slate-800 text-orange-400 px-2 py-0.5 rounded-full border border-slate-700">
                              {partido.asistentes ? partido.asistentes.length : 0}
                            </span>
                          </h4>

                          {partido.asistentes && partido.asistentes.length > 0 ? (
                            <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {partido.asistentes.map((asistente, idx) => (
                                <li
                                  key={asistente.id || idx}
                                  className="bg-slate-800/50 border border-slate-700/60 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-100 flex items-center space-x-2"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                                  <span>{asistente.nombre}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 text-xs italic bg-slate-800/30 p-3 rounded-lg border border-slate-800 text-center">
                              Aún no hay personas registradas. ¡Sé el primero!
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm">No hay ningún partido programado para el día <span className="font-bold text-slate-300">{selectedDate}</span>.</p>
                  </div>
                )
              ) : (
                <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm px-4">
                    Selecciona cualquier día marcado en <span className="text-orange-400 font-bold">naranja</span> en el calendario para apuntarte y ver quién va.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </main>
  );
}