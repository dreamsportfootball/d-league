import type { Match } from '../types';
import type { MatchEvent } from '../types/matchEvent';

/**
 * Resolve the team that the named player represented, NOT necessarily the
 * team credited with the goal.
 *
 * 2025/26 legacy own goals: team = beneficiary, no scoringTeam.
 * 2026/27+ own goals: team = player side; scoringTeam = beneficiary.
 * All other events: team = player side.
 */
export const getMatchEventPlayerTeamId = (
  match: Pick<Match, 'homeTeamId' | 'awayTeamId'>,
  event: Pick<MatchEvent, 'team' | 'isOwnGoal' | 'scoringTeam'>,
): string => {
  const legacyOwnGoal = event.isOwnGoal === true && event.scoringTeam === undefined;
  const playerIsHome = legacyOwnGoal ? event.team === 'AWAY' : event.team === 'HOME';
  return playerIsHome ? match.homeTeamId : match.awayTeamId;
};
