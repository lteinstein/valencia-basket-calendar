export type MatchLocation = 'local' | 'visitante';
export type MatchStatus = 'upcoming' | 'played' | 'cancelled';

export interface Match {
  id: string;
  created_at?: string;
  date: string;
  time: string;
  opponent: string;
  location: MatchLocation;
  competition: string;
  status: MatchStatus;
  notes?: string;
  attendees_count?: number;
}

export interface Attendee {
  id: string;
  created_at?: string;
  match_id: string;
  name: string;
}