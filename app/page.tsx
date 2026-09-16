'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase con las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Asistente {
  id?: string;
  nombre: string;
}

interface Partido {
  id: string;
  rival: string;
  fecha: string; // Formato YYYY-MM-DD
  hora: string;
  lugar?: string;
  asistentes?: Asistente[];
}

export default function Home() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchPartidos();
  }, []);

  async function fetchPartidos() {
    setLoading(true);
    try {
      // Traemos los partidos con sus asistentes relacionados
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
            nombre
          )
        `);

      if (error) {
        // Fallback si la relación explícita no está definida en Supabase
        const { data: partidosSimples, error: errSimple } = await supabase
          .from('partidos')
          .select('*');
        if (!errSimple && partidosSimples) {
          setPartidos(partidosSimples);
        }
      } else if (data) {
        setPartidos(data as Partido[]);
      }
    } catch (err) {
      console.error('Error al cargar partidos:', err);
    } finally {
      setLoading(false);
    }
  }

  // Función auxiliar para formatear fechas de forma limpia sin problemas de zona horaria UTC
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Mapeo rápido de partidos por fecha (YYYY-MM-DD)
  const partidosMap = partidos.reduce((acc, partido) => {
    // Normalizar la fecha del partido a YYYY-MM-DD
    const dateKey = partido.fecha.substring(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(partido);
    return acc;
  }, {} as Record<string, Partido[]>);

  // Obtener el partido seleccionado para ver los detalles y asistentes
  const partidoSeleccionado = selectedDate ? partidosMap[selectedDate] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wide">
          VALENCIA BASKET
        </h1>
        <p className="text-slate-400 text-sm mt-1">Calendario de Partidos y Asistencia</p>
      </header>

      {loading ? (
        <div className="text-orange-400 font-medium my-12 animate-pulse">
          Cargando partidos...
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECCIÓN CALENDARIO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
              Calendario
            </h2>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
              <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            
            {/* Lista simple de días/partidos del mes */}
            <div className="space-y-3 mt-4">
              {partidos.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No hay partidos registrados.</p>
              ) : (
                partidos.map((partido) => {
                  const dateKey = partido.fecha.substring(0, 10);
                  const isSelected = selectedDate === dateKey;

                  return (
                    <div
                      key={partido.id}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-orange-500/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Indicador de color para resaltar el día con partido */}
                        <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500" />
                        <div>
                          <div className="font-bold text-sm">vs {partido.rival}</div>
                          <div className="text-xs text-slate-400">
                            {dateKey} {partido.hora ? `• ${partido.hora}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                        {partido.asistentes ? partido.asistentes.length : 0} van
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECCIÓN DETALLE Y ASISTENTES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
              Asistentes al Partido
            </h2>

            {partidoSeleccionado && partidoSeleccionado.length > 0 ? (
              <div className="space-y-6">
                {partidoSeleccionado.map((p) => (
                  <div key={p.id} className="space-y-4">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                      <h3 className="text-lg font-bold text-orange-400">vs {p.rival}</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        📅 Fecha: <span className="text-white font-medium">{p.fecha.substring(0, 10)}</span>
                      </p>
                      {p.hora && (
                        <p className="text-xs text-slate-300 mt-0.5">
                          ⏰ Hora: <span className="text-white font-medium">{p.hora}</span>
                        </p>
                      )}
                      {p.lugar && (
                        <p className="text-xs text-slate-300 mt-0.5">
                          📍 Lugar: <span className="text-white font-medium">{p.lugar}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">
                        Personas confirmadas:
                      </h4>
                      {p.asistentes && p.asistentes.length > 0 ? (
                        <ul className="space-y-2">
                          {p.asistentes.map((asistente, idx) => (
                            <li
                              key={asistente.id || idx}
                              className="bg-slate-800/40 border border-slate-700/60 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-100 flex items-center space-x-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>{asistente.nombre}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 text-sm italic bg-slate-800/20 p-3 rounded-lg border border-slate-800">
                          Aún no hay asistentes confirmados para este partido.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-400 text-sm font-medium">
                  Haz clic en cualquier partido de la lista para ver la fecha, hora y quién va a asistir.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}