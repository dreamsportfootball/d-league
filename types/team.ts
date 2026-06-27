import type { LeagueId, SeasonId } from './season';

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
  competitionStatus?: 'ACTIVE' | 'WITHDRAWN';
  pointsAdjustment?: number;
  pointsAdjustmentReason?: string;
  manualTiebreakOrder?: number;
}
