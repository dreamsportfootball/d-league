import type { LeagueId, SeasonId } from './season';

export interface TeamSocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export interface TeamBrandingAsset {
  logoFile: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TeamStaffMember {
  role: string;
  name: string;
  englishName?: string;
}

export interface TeamKits {
  home: string;
  away: string;
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
  kits?: TeamKits;
  socialLinks?: TeamSocialLinks;
  staff?: TeamStaffMember[];
  competitionStatus?: 'ACTIVE' | 'WITHDRAWN';
  pointsAdjustment?: number;
  pointsAdjustmentReason?: string;
  manualTiebreakOrder?: number;
}
