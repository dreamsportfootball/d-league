export type SeasonId = '2025-26' | '2026-27';

export type LeagueId = 'L1' | 'L2' | 'L3';

export type SeasonStatus =
  | 'registration'
  | 'review'
  | 'upcoming'
  | 'active'
  | 'completed';

export type CompetitionFormat = 'double-round-robin' | 'triple-round-robin';

export interface LeagueConfig {
  id: LeagueId;
  displayName: string;
  shortName: LeagueId;
  expectedTeamCount: number;
  format: CompetitionFormat;
  rounds: number;
  matchesPerTeam: number;
  promotionPlaces: number;
  relegationPlaces: number;
  hasPlayoff: boolean;
  description: string;
}

export interface SeasonConfig {
  id: SeasonId;
  displayName: string;
  shortName: string;
  status: SeasonStatus;
  isDefault: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  venue: string;
  registrationFormUrl?: string;
  regulationsUrl?: string;
  heroImageDesktop?: string;
  heroImageMobile?: string;
  heroFallbackImage: string;
  youtubePlaylistEmbedUrl?: string;
  youtubePlaylistLabel?: string;
  enabledLeagues: LeagueId[];
  registrationMessage?: string;
  leagues: Record<LeagueId, LeagueConfig | null>;
}
