'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Match, Attendee } from '@/lib/types';
import Header from '../../components/Header';
import MatchModal from '../../components/MatchModal';
import AttendeeModal from '../../components/AttendeeModal';
import NotificationToast from '../../components/NotificationToast';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditMatchOpen, setIsEditMatchOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchDetails = async () => {
    setLoading(true);
    const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!matchData) { router.push('/'); return; }
    setMatch(matchData);

    const { data: attendeesData } = await supabase.from('attendees').select('*').eq('match_id', matchId);
    setAttendees(attendeesData || []);
    setLoading(false);
  };

  useEffect(() => { if (matchId) fetchDetails(); }, [matchId]);

  const handleUpdateMatch = async (matchData: Partial<Match>) => {
    const { error } = await supabase.from('matches').update(matchData).eq('id', matchId);
    if (!error) { showToast('Partido actualizado'); fetchDetails(); }
  };

  const handleDeleteMatch = async () => {
    if (confirm('¿Eliminar partido?')) {
      await supabase.from('matches').delete().eq('id', matchId);
      router.push('/');
    }
  };

  const handleSaveAttendee = async (name: string) => {
    if (editingAttendee) {
      await supabase.from('attendees').update({ name }).eq('id', editingAttendee.id);
    } else {
      await supabase.from('attendees').insert([{ match_id: matchId, name }]);
    }
    showToast('Lista actualizada');
    fetchDetails();
  };

  const handleDeleteAttendee = async (id: string) => {
    if (confirm('¿Eliminar asistente?')) {
      await supabase.from('attendees').delete().eq('id', id);
      showToast('Asistente eliminado');
      fetchDetails();
    }
  };

  if (loading || !match) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-vbc-orange text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al calendario
        </Link>

        <div className="bg-vbc-darkgray border border-zinc-800 rounded-2xl p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-vbc-orange/20 text-vbc-orange font-bold text-xs px-3 py-1 rounded-full uppercase">
              {match.competition}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setIsEditMatchOpen(true)} className="p-2 bg-zinc-900 text-gray-300 rounded-lg text-xs"><Edit2 className="w-4 h-4" /></button>
              <button onClick={handleDeleteMatch} className="p-2 bg-red-900/40 text-red-400 rounded-lg text-xs"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase text-center my-4">
            Valencia Basket <span className="text-vbc-orange">vs</span> {match.opponent}
          </h1>

          <div className="flex justify-center gap-6 text-sm text-gray-300 mt-4 border-t border-zinc-800 pt-4">
            <span>📅 {match.date}</span>
            <span>🕐 {match.time}</span>
            <span className="capitalize">📍 {match.location}</span>
          </div>
        </div>

        <div className="bg-vbc-darkgray border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-white">👥 Asistentes ({attendees.length})</h2>
            <button onClick={() => { setEditingAttendee(null); setIsAttendeeModalOpen(true); }} className="bg-vbc-orange text-black font-bold px-3 py-1.5 rounded-lg text-sm">
              + Añadir Persona
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attendees.map(a => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-zinc-900 rounded-xl">
                <span className="flex items-center gap-2 text-white"><CheckCircle className="w-4 h-4 text-vbc-orange" /> {a.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingAttendee(a); setIsAttendeeModalOpen(true); }} className="text-gray-400 p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteAttendee(a.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MatchModal isOpen={isEditMatchOpen} onClose={() => setIsEditMatchOpen(false)} onSave={handleUpdateMatch} initialData={match} />
      <AttendeeModal isOpen={isAttendeeModalOpen} onClose={() => setIsAttendeeModalOpen(false)} onSave={handleSaveAttendee} initialData={editingAttendee} />
      <NotificationToast message={toastMessage} />
    </div>
  );
}