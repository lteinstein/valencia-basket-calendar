'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match } from '@/lib/types';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import MatchModal from './components/MatchModal';
import NotificationToast from './components/NotificationToast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [year, setYear] = useState(2026);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedEmptyDate, setSelectedEmptyDate] = useState<string | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('matches').select('*, attendees(id)');
    if (!error && data) {
      setMatches(data.map(m => ({ ...m, attendees_count: m.attendees ? m.attendees.length : 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleCreateMatch = async (matchData: Partial<Match>) => {
    const { error } = await supabase.from('matches').insert([matchData]);
    if (!error) {
      showToast('Partido añadido');
      fetchMatches();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenNewMatchModal={() => { setSelectedEmptyDate(undefined); setIsMatchModalOpen(true); }} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <div className="bg-vbc-darkgray border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setYear(year - 1)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-2xl font-black text-white">{year}</span>
            <button onClick={() => setYear(year + 1)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando partidos...</div>
        ) : (
          <CalendarView
            year={year}
            matches={matches}
            onSelectMatch={id => window.location.href = `/partido/${id}`}
            onSelectEmptyDate={dateStr => { setSelectedEmptyDate(dateStr); setIsMatchModalOpen(true); }}
          />
        )}
      </main>

      <MatchModal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} onSave={handleCreateMatch} defaultDate={selectedEmptyDate} />
      <NotificationToast message={toastMessage} />
    </div>
  );
}