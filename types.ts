// Shared legacy-compatible types. New season-aware types live under /types.

import type { SeasonId } from './types/season';

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
  FINISHED = 'FINISHED'
}

export type LeagueCode = 'L1' | 'L2' | 'L3' | 'CUP';

export type MatchResultType = 'PLAYED' | 'FORFEIT' | 'DOUBLE_FORFEIT' | 'VOID';

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
  resultType?: MatchResultType;
  countsForStandings?: boolean;
  countsForPlayerStats?: boolean;
  countsForSuspensionService?: boolean;
  administrativeNote?: string;
  videoUrl?: string;
  albumId?: string;
  reportArticleId?: string;
}

export type StandingTieStatus = 'NONE' | 'SHARED' | 'DRAW_REQUIRED';

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
  pointsAdjustment: number;
  directRedCards: number;
  secondYellowDismissals: number;
  yellowCards: number;
  rank: number;
  tieStatus: StandingTieStatus;
  form: ('W' | 'D' | 'L')[];
}

export interface NewsArticle {
  id: string;
  seasonId?: SeasonId;
  title: string;
  summary: string;
  highlight?: string;
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

// Runtime compatibility value for the legacy matchData import.
// The actual MatchEvent interface is centralized in types/matchEvent.ts.
export const MatchEvent = Symbol('MatchEvent');
