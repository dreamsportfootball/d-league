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

export type CriticalTieResolution = 'SHARED' | 'PUBLIC_DRAW';

export interface CompetitionRules {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  rankingCriteria: RankingCriterion[];
  criticalTieResolution: CriticalTieResolution;
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
  ageSummary?: string;
  minimumPlayers: number;
  maximumPlayers: number;
  maximumStaff: number;
  staffDescription: string;
  steps: string[];
  faqItems: RegistrationFaqItem[];
  reviewDescription: string;
  reviewFeatures: string[];
}

export interface RegistrationDeadlineConfig {
  label: string;
  deadline: string;
}

export interface RegistrationResultsConfig {
  announcedAt: string;
  acceptedTeams: string[];
  waitlistedTeams: string[];
  note: string;
  groupingNote: string;
  deadlines: RegistrationDeadlineConfig[];
  detailsNote: string;
}

export interface SeasonParticipantsConfig {
  confirmedAt: string;
  leagues: Record<LeagueId, string[]>;
  note: string;
  nextStep: string;
  deadlines: RegistrationDeadlineConfig[];
  detailsNote: string;
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
  /**
   * Final table positions whose order must be resolved because an actual
   * next-season replacement vacancy depends on them. Keep empty/undefined
   * until a replacement situation actually exists.
   */
  replacementTiebreakRanks?: number[];
  hasPlayoff: boolean;
  description: string;
}

export interface SeasonConfig {
  id: SeasonId;
  displayName: string;
  shortName: string;
  status: SeasonStatus;
  isDefault: boolean;
  /** Fixed date used to resolve every player's official age for this season. */
  ageReferenceDate: string;
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
  registrationResults?: RegistrationResultsConfig;
  seasonParticipants?: SeasonParticipantsConfig;
  rules: CompetitionRules;
  standingsDisplay: StandingsDisplayConfig;
  leagues: Record<LeagueId, LeagueConfig | null>;
}
