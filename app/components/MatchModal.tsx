'use client';
import { useState, useEffect } from 'react';
import { Match } from '@/lib/types';
import { X } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchData: Partial<Match>) => Promise<void>;
  initialData?: Match | null;
  defaultDate?: string;
}

export default function MatchModal({ isOpen, onClose, onSave, initialData, defaultDate }: MatchModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:30');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState<'local' | 'visitante'>('local');
  const [competition, setCompetition] = useState('Liga Endesa');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setTime(initialData.time);
      setOpponent(initialData.opponent);
      setLocation(initialData.location);
      setCompetition(initialData.competition);
      setNotes(initialData.notes || '');
    } else {
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('20:30');
      setOpponent('');
      setLocation('local');
      setCompetition('Liga Endesa');
      setNotes('');
    }
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ date, time, opponent, location, competition, status: 'upcoming', notes });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-vbc-darkgray border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
          <h2 className="text-lg font-bold text-vbc-orange uppercase">
            {initialData ? 'Editar Partido' : 'Nuevo Partido'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Hora</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Rival</label>
            <input type="text" required placeholder="Ej. Real Madrid" value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Condición</label>
              <select value={location} onChange={e => setLocation(e.target.value as 'local' | 'visitante')} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white">
                <option value="local">Local</option>
                <option value="visitante">Visitante</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Competición</label>
              <select value={competition} onChange={e => setCompetition(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white">
                <option value="Liga Endesa">Liga Endesa</option>
                <option value="EuroLeague">EuroLeague</option>
                <option value="Copa del Rey">Copa del Rey</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notas</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-800 text-gray-300">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-vbc-orange text-black font-bold uppercase">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}