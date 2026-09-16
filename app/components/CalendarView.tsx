'use client';
import { Match } from '@/lib/types';
import { Users } from 'lucide-react';

interface CalendarViewProps {
  year: number;
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  onSelectEmptyDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function CalendarView({ year, matches, onSelectMatch, onSelectEmptyDate }: CalendarViewProps) {
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOffset = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {MONTH_NAMES.map((monthName, monthIdx) => {
        const daysInMonth = getDaysInMonth(monthIdx, year);
        const firstDayOffset = getFirstDayOffset(monthIdx, year);

        return (
          <div key={monthName} className="bg-vbc-darkgray border border-zinc-800 rounded-xl p-4 flex flex-col">
            <h3 className="text-lg font-bold text-vbc-orange uppercase mb-3 text-center border-b border-zinc-800 pb-2">
              {monthName}
            </h3>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
              {WEEKDAYS.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayMatches = matches.filter(m => m.date === dateStr);
                const hasMatch = dayMatches.length > 0;

                return (
                  <div
                    key={dateStr}
                    className={`h-10 rounded-md border flex flex-col items-center justify-between p-1 cursor-pointer transition-all ${
                      hasMatch
                        ? 'bg-vbc-orange border-vbc-orange text-black font-bold shadow-md hover:scale-105'
                        : 'bg-zinc-900 border-zinc-800 text-gray-300 hover:border-vbc-orange/50'
                    }`}
                    onClick={() => {
                      if (hasMatch) onSelectMatch(dayMatches[0].id);
                      else onSelectEmptyDate(dateStr);
                    }}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {hasMatch && (
                      <div className="flex items-center gap-0.5 text-[10px] bg-black/80 text-white px-1 rounded-full">
                        <span>🏀</span>
                        {dayMatches[0].attendees_count !== undefined && (
                          <span className="flex items-center text-[9px]">
                            <Users className="w-2.5 h-2.5 text-vbc-orange mr-0.5" />
                            {dayMatches[0].attendees_count}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}