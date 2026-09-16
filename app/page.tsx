'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [rival, setRival] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('20:30');
  const [lugar, setLugar] = useState('La Fonteta');
  const [condicion, setCondicion] = useState('Local');
  const [nombreAsistente, setNombreAsistente] = useState('');

  useEffect(() => {
    fetchDatos();
  }, []);

  async function fetchDatos() {
    const { data: p } = await supabase.from('partidos').select('*');
    const { data: a } = await supabase.from('asistentes').select('*');
    if (p) setPartidos(p);
    if (a) setAsistentes(a);
  }

  const guardarPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rival || !fecha) return alert('Rival y fecha obligatorios');

    const { error } = await supabase.from('partidos').insert([{ rival, fecha, hora, lugar, condicion }]);
    if (error) {
      alert('Error al guardar en Supabase: ' + error.message);
    } else {
      alert('¡Partido guardado con éxito!');
      setRival('');
      setFecha('');
      setSelectedDate(fecha);
      fetchDatos();
    }
  };

  const borrarPartido = async (id: string) => {
    if (!confirm('¿Borrar partido?')) return;
    await supabase.from('partidos').delete().eq('id', id);
    fetchDatos();
    setSelectedDate(null);
  };

  const apuntarAsistente = async (partidoId: string) => {
    if (!nombreAsistente.trim()) return alert('Escribe un nombre');
    const { error } = await supabase.from('asistentes').insert([{ nombre: nombreAsistente.trim(), partido_id: partidoId }]);
    if (error) {
      alert('Error al apuntar: ' + error.message);
    } else {
      setNombreAsistente('');
      fetchDatos();
    }
  };

  const borrarAsistente = async (id: string) => {
    await supabase.from('asistentes').delete().eq('id', id);
    fetchDatos();
  };

  const partidosMap = partidos.reduce((acc, p) => {
    if (!p.fecha) return acc;
    const key = p.fecha.substring(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const partidosDelDia = selectedDate ? partidosMap[selectedDate] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-black text-orange-500 mb-6">VALENCIA BASKET - GESTIÓN</h1>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FORMULARIO CREAR PARTIDO */}
        <form onSubmit={guardarPartido} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-orange-400">Publicar Nuevo Partido</h2>
          <input type="text" placeholder="Rival (ej. Real Madrid)" value={rival} onChange={e => setRival(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm" required />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm" required />
            <select value={condicion} onChange={e => setCondicion(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm">
              <option value="Local">Local</option>
              <option value="Visitante">Visitante</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Hora" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm" />
            <input type="text" placeholder="Lugar" value={lugar} onChange={e => setLugar(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm" />
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 font-bold py-2 rounded text-sm transition-colors">Guardar y Publicar</button>
        </form>

        {/* LISTADO RÁPIDO Y CALENDARIO DE PRUEBA */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-orange-400">Partidos Guardados (Selecciona fecha)</h2>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {partidos.length === 0 ? (
              <p className="text-xs text-slate-500">No hay partidos creados aún.</p>
            ) : (
              partidos.map(p => (
                <button key={p.id} onClick={() => setSelectedDate(p.fecha.substring(0, 10))} className={`px-3 py-1.5 rounded text-xs font-bold border ${selectedDate === p.fecha.substring(0, 10) ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {p.fecha.substring(0, 10)} - {p.rival}
                </button>
              ))
            )}
          </div>

          {selectedDate && (
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Información del {selectedDate}:</h3>
              {partidosDelDia && partidosDelDia.length > 0 ? (
                partidosDelDia.map((p: any) => {
                  const asistenPartido = asistentes.filter(a => a.partido_id === p.id);
                  return (
                    <div key={p.id} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold">{p.condicion}</span>
                          <h4 className="font-extrabold text-white text-base mt-1">vs {p.rival}</h4>
                          <p className="text-xs text-slate-400">⏰ {p.hora} | 📍 {p.lugar}</p>
                        </div>
                        <button onClick={() => borrarPartido(p.id)} className="text-xs text-red-400 hover:text-red-300">Borrar partido</button>
                      </div>

                      {/* ASISTENTES */}
                      <div className="border-t border-slate-700/60 pt-2 space-y-2">
                        <p className="text-xs font-bold text-slate-300">Asistentes ({asistenPartido.length}):</p>
                        <div className="flex space-x-2">
                          <input type="text" placeholder="Tu nombre..." value={nombreAsistente} onChange={e => setNombreAsistente(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white" />
                          <button onClick={() => apuntarAsistente(p.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs">Apuntar</button>
                        </div>
                        {asistenPartido.length > 0 && (
                          <ul className="space-y-1 pt-1 max-h-24 overflow-y-auto">
                            {asistenPartido.asistenPartido || asistenPartido.map((a: any) => (
                              <li key={a.id} className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded text-xs">
                                <span>{a.nombre}</span>
                                <button onClick={() => borrarAsistente(a.id)} className="text-slate-500 hover:text-red-400">✕</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">No hay partidos este día.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}