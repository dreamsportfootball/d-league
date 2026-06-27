import type { LeagueId, SeasonId } from './season';

export interface TeamSocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export interface SeasonTeam {
  id: string;
  identityId?: string;
  seasonId: SeasonId;
  leagueId: LeagueId;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
  socialLinks?: TeamSocialLinks;
  competitionStatus?: 'ACTIVE' | 'WITHDRAWN';
  pointsAdjustment?: number;
  pointsAdjustmentReason?: string;
  manualTiebreakOrder?: number;
}
