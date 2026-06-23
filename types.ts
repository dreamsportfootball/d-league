// Shared legacy-compatible types. New season-aware types live under /types.

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED'
}

export type LeagueCode = 'L1' | 'L2' | 'L3' | 'CUP';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  timestamp: string;
  venue: string;
  league: LeagueCode;
  round: number | string;
}

export interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Official' | 'Match Report';
  imageUrl: string;
  timestamp: string;
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  date: string;
  link?: string;
}

export type MatchEventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW';

export interface MatchEvent {
  id: string;
  minute: number;
  player: string;
  type: MatchEventType;
  team: 'HOME' | 'AWAY';
  isPK?: boolean;
  isOwnGoal?: boolean;
}
