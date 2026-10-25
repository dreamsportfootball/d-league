import { MatchStatus, type Match } from '../types';

export type FormResult = 'W' | 'D' | 'L';
export interface TeamFormMatch {
  match: Match;
  result: FormResult;
  goalsFor: number;
  goalsAgainst: number;
}
export interface TeamFormSummary {
  recent: TeamFormMatch[];
  winStreak: number;
  goalsFor: number;
  goalsAgainst: number;
}

const classify = (match: Match, teamId: string): TeamFormMatch | null => {
  if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) return null;
  if (match.resultType === 'VOID' || match.countsForStandings === false) return null;
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  if (match.status !== MatchStatus.FINISHED && !hasScore) return null;
  if (match.resultType === 'DOUBLE_FORFEIT') {
    return { match, result: 'L', goalsFor: 0, goalsAgainst: 0 };
  }
  if (match.homeScore === null || match.awayScore === null) return null;
  const home = match.homeTeamId === teamId;
  const goalsFor = home ? match.homeScore : match.awayScore;
  const goalsAgainst = home ? match.awayScore : match.homeScore;
  const result: FormResult = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
  return { match, result, goalsFor, goalsAgainst };
};

/** The caller provides only matches from the selected season and eligible league. */
export const getTeamFormSummary = (teamId: string, matches: Match[]): TeamFormSummary => {
  const completed = matches
    .map((match) => classify(match, teamId))
    .filter((item): item is TeamFormMatch => item !== null)
    .sort((a, b) => new Date(b.match.timestamp).getTime() - new Date(a.match.timestamp).getTime() ||
      b.match.id.localeCompare(a.match.id));
  const recent = completed.slice(0, 5);
  let winStreak = 0;
  for (const item of completed) {
    if (item.result !== 'W') break;
    winStreak++;
  }
  return {
    recent,
    winStreak,
    goalsFor: recent.reduce((sum, item) => sum + item.goalsFor, 0),
    goalsAgainst: recent.reduce((sum, item) => sum + item.goalsAgainst, 0),
  };
};
