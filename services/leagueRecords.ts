import { SEASON_IDS } from '../config/siteManifest.js';
import { getSeasonConfig } from '../config/seasons';
import { getSeasonData } from './seasonDataJson';
import { MatchStatus, type Match } from '../types';
import type { LeagueId, SeasonId } from '../types/season';

export type RecordKind = 'MATCH_GOALS' | 'WIN_MARGIN' | 'TOTAL_GOALS' | 'WIN_STREAK' | 'SEASON_GOALS';

export interface LeagueRecord {
  kind: RecordKind;
  label: string;
  value: number;
  unit: string;
  subject: string;
  detail: string;
  seasonId: SeasonId;
  league: LeagueId;
  tiedCount: number;
}

const categories: readonly { kind: RecordKind; label: string; unit: string }[] = [
  { kind: 'MATCH_GOALS', label: '單場球隊最多進球', unit: '球' },
  { kind: 'WIN_MARGIN', label: '單場最大勝分差', unit: '球' },
  { kind: 'TOTAL_GOALS', label: '單場雙方總進球', unit: '球' },
  { kind: 'WIN_STREAK', label: '最長連勝', unit: '場' },
  { kind: 'SEASON_GOALS', label: '單季球隊總進球', unit: '球' },
];

type Candidate = Omit<LeagueRecord, 'label' | 'unit' | 'tiedCount'>;
const isCounted = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED &&
  match.homeScore !== null && match.awayScore !== null &&
  match.resultType !== 'VOID' &&
  match.resultType !== 'FORFEIT' &&
  match.resultType !== 'DOUBLE_FORFEIT' &&
  match.countsForStandings !== false;

export const getCompletedSeasonRecords = (): Map<LeagueId, LeagueRecord[]> => {
  const candidates: Candidate[] = [];

  SEASON_IDS.forEach((seasonId) => {
    const season = getSeasonConfig(seasonId);
    if (season.status !== 'completed') return;

    const data = getSeasonData(seasonId);
    season.enabledLeagues.forEach((league) => {
      const leagueConfig = season.leagues[league];
      if (!leagueConfig) return;
      const matches = data.matches
        .filter((match) => match.league === league)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id));
      const expectedCount = (leagueConfig.expectedTeamCount * leagueConfig.matchesPerTeam) / 2;
      // An incomplete or unconfirmed fixture set must never create a historical record.
      if (matches.length !== expectedCount || !matches.every(isCounted)) return;

      const teamNames = (id: string): string => data.teamMap[id]?.name ?? id;
      const totalGoals = new Map<string, number>();
      const results = new Map<string, { match: Match; won: boolean }[]>();
      matches.forEach((match) => {
        const homeScore = match.homeScore;
        const awayScore = match.awayScore;
        if (homeScore === null || awayScore === null) return;
        const homeName = teamNames(match.homeTeamId);
        const awayName = teamNames(match.awayTeamId);
        const detail = `${homeName} ${homeScore}–${awayScore} ${awayName}`;
        for (const [teamId, goals] of [[match.homeTeamId, homeScore], [match.awayTeamId, awayScore]] as const) {
          totalGoals.set(teamId, (totalGoals.get(teamId) ?? 0) + goals);
          candidates.push({
            kind: 'MATCH_GOALS', value: goals, subject: teamNames(teamId),
            detail, seasonId, league,
          });
        }
        const winningId = homeScore > awayScore ? match.homeTeamId : awayScore > homeScore ? match.awayTeamId : null;
        if (winningId) candidates.push({
          kind: 'WIN_MARGIN', value: Math.abs(homeScore - awayScore),
          subject: teamNames(winningId), detail, seasonId, league,
        });
        candidates.push({
          kind: 'TOTAL_GOALS', value: homeScore + awayScore,
          subject: `${homeName} vs ${awayName}`, detail, seasonId, league,
        });
        for (const id of [match.homeTeamId, match.awayTeamId]) {
          const rows = results.get(id) ?? [];
          rows.push({ match, won: id === winningId });
          results.set(id, rows);
        }
      });

      totalGoals.forEach((value, teamId) => {
        candidates.push({
          kind: 'SEASON_GOALS', value, subject: teamNames(teamId),
          detail: `${season.shortName} · ${league} 完整賽季`, seasonId, league,
        });
      });
      results.forEach((games, teamId) => {
        let current = 0;
        let longest = 0;
        games.forEach(({ won }) => {
          current = won ? current + 1 : 0;
          longest = Math.max(longest, current);
        });
        if (longest > 0) candidates.push({
          kind: 'WIN_STREAK', value: longest, subject: teamNames(teamId),
          detail: `${season.shortName} · ${league} 連續正式賽事`, seasonId, league,
        });
      });
    });
  });

  const leagueIds = [...new Set(candidates.map((row) => row.league))];
  const records = new Map<LeagueId, LeagueRecord[]>();
  leagueIds.forEach((league) => {
    records.set(league, categories.flatMap(({ kind, label, unit }) => {
      const rows = candidates.filter((item) => item.kind === kind && item.league === league);
      if (rows.length === 0) return [];
      const best = Math.max(...rows.map((item) => item.value));
      const tied = rows.filter((item) => item.value === best).sort((a, b) =>
        a.seasonId.localeCompare(b.seasonId) || a.subject.localeCompare(b.subject, 'zh-TW'));
      return [{ ...tied[0], label, unit, tiedCount: tied.length }];
    }));
  });
  return records;
};
