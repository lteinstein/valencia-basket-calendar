'use client';
import { useState, useEffect } from 'react';
import { Attendee } from '@/lib/types';
import { X } from 'lucide-react';

interface AttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialData?: Attendee | null;
}

export default function AttendeeModal({ isOpen, onClose, onSave, initialData }: AttendeeModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialData ? initialData.name : '');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-vbc-darkgray border border-zinc-800 w-full max-w-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
          <h2 className="text-lg font-bold text-vbc-orange uppercase">
            {initialData ? 'Editar Asistente' : 'Añadir Asistente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
            <input type="text" required placeholder="Ej. Carlos" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white" />
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