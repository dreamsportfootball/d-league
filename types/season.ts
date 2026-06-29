import type { SEASON_IDS } from '../config/siteManifest.js';

export type SeasonId = (typeof SEASON_IDS)[number];

export type LeagueId = 'L1' | 'L2' | 'L3';

export type SeasonStatus =
  | 'registration'
  | 'review'
  | 'upcoming'
  | 'active'
  | 'completed';

export type CompetitionFormat = 'double-round-robin' | 'triple-round-robin';

export type RankingCriterion =
  | 'GOAL_DIFFERENCE'
  | 'GOALS_FOR'
  | 'HEAD_TO_HEAD_POINTS'
  | 'HEAD_TO_HEAD_GOAL_DIFFERENCE'
  | 'HEAD_TO_HEAD_GOALS_FOR'
  | 'FEWEST_DIRECT_RED'
  | 'FEWEST_SECOND_YELLOW'
  | 'FEWEST_YELLOW';

export interface CompetitionRules {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  rankingCriteria: RankingCriterion[];
  yellowCardSuspensionThreshold: number;
  automaticSuspensionMatches: number;
  yellowCardFine: number;
  secondYellowFine: number;
  directRedFine: number;
  resetCrossMatchYellowsAfterAnySuspension: boolean;
}

export interface StandingsDisplayConfig {
  showPointsSummary: boolean;
  rankingRules: string[];
  footerNote?: string;
}

export interface RegistrationFaqItem {
  question: string;
  answer: string;
}

export interface RegistrationContentConfig {
  intro: string;
  ageReferenceDate: string;
  minimumAge: number;
  minimumPlayers: number;
  maximumPlayers: number;
  maximumStaff: number;
  staffDescription: string;
  steps: string[];
  faqItems: RegistrationFaqItem[];
  reviewDescription: string;
  reviewFeatures: string[];
}

export interface RegistrationProgressConfig {
  receivedTeams: number;
  updatedAt: string;
  note: string;
}

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
  registrationContent?: RegistrationContentConfig;
  rules: CompetitionRules;
  standingsDisplay: StandingsDisplayConfig;
  leagues: Record<LeagueId, LeagueConfig | null>;
}
