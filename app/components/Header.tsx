'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onOpenNewMatchModal?: () => void;
}

export default function Header({ onOpenNewMatchModal }: HeaderProps) {
  return (
    <header className="bg-vbc-darkgray border-b border-orange-500/20 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-vbc-orange flex items-center justify-center font-bold text-black text-xl">
            🏀
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase group-hover:text-vbc-orange transition-colors">
              Valencia Basket
            </h1>
            <p className="text-xs text-gray-400">Calendario &amp; Asistencia</p>
          </div>
        </Link>

        {onOpenNewMatchModal && (
          <button
            onClick={onOpenNewMatchModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-vbc-orange hover:bg-vbc-orange-dark text-black font-bold px-4 py-2.5 rounded-lg text-sm uppercase"
          >
            <Plus className="w-5 h-5" />
            Añadir Partido
          </button>
        )}
      </div>
    </header>
  );
}