import type { LeagueId, SeasonId } from './season';

export interface SeasonTeam {
  id: string;
  seasonId: SeasonId;
  leagueId: LeagueId;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
}
