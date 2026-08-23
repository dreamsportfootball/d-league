import type { LeagueId, SeasonId } from '../types/season';
import { calculateLeagueTable, calculatePlayerCompetitionStats } from './competitionEngine';
import {
  getPlayerHistory,
  resolveMatchEventPlayer,
  type PlayerSeasonRecord,
} from './entityData';

export type PlayerHonourKind =
  | 'GOLDEN_BOOT'
  | 'LEAGUE_CHAMPION'
  | 'LEAGUE_RUNNER_UP';

export interface PlayerHonour {
  id: string;
  seasonId: SeasonId;
  seasonName: string;
  leagueId: LeagueId;
  kind: PlayerHonourKind;
  title: '金靴獎' | '聯賽冠軍' | '聯賽亞軍';
  teamId?: string;
  teamName?: string;
}

type LineupSide = 'HOME' | 'AWAY';

const getLineupSide = (lineup: unknown, playerId: string): LineupSide | null => {
  if (!lineup || typeof lineup !== 'object') return null;

  const candidate = lineup as {
    homePlayerIds?: unknown;
    awayPlayerIds?: unknown;
  };
  const homePlayerIds = Array.isArray(candidate.homePlayerIds)
    ? candidate.homePlayerIds
    : [];
  const awayPlayerIds = Array.isArray(candidate.awayPlayerIds)
    ? candidate.awayPlayerIds
    : [];

  if (homePlayerIds.includes(playerId)) return 'HOME';
  if (awayPlayerIds.includes(playerId)) return 'AWAY';
  return null;
};

const getRepresentedTeamIds = (record: PlayerSeasonRecord): Set<string> => {
  const teamIds = new Set<string>();
  const addTeam = (teamId: string | undefined) => {
    if (teamId && record.data.teamMap[teamId]) teamIds.add(teamId);
  };

  addTeam(record.player.teamId);
  record.player.registrations?.forEach((registration) => addTeam(registration.teamId));

  Object.entries(record.data.lineups).forEach(([matchId, lineup]) => {
    const match = record.data.matches.find((candidate) => candidate.id === matchId);
    if (!match) return;
    const side = getLineupSide(lineup, record.player.id);
    if (side === 'HOME') addTeam(match.homeTeamId);
    if (side === 'AWAY') addTeam(match.awayTeamId);
  });

  Object.entries(record.data.matchEvents).forEach(([matchId, events]) => {
    const match = record.data.matches.find((candidate) => candidate.id === matchId);
    if (!match) return;

    events.forEach((event) => {
      if (resolveMatchEventPlayer(record.data, match, event)?.id !== record.player.id) return;
      addTeam(event.team === 'HOME' ? match.homeTeamId : match.awayTeamId);
    });
  });

  return teamIds;
};

const getTopScorerIds = (
  record: PlayerSeasonRecord,
  leagueId: LeagueId,
): Set<string> => {
  const stats = calculatePlayerCompetitionStats(
    leagueId,
    record.data.teams,
    record.data.players,
    record.data.matches,
    record.data.matchEvents,
  );

  const goalsByPlayer = new Map<string, number>();
  stats.forEach((row) => {
    goalsByPlayer.set(row.subjectId, (goalsByPlayer.get(row.subjectId) ?? 0) + row.goals);
  });

  const topGoalCount = Math.max(0, ...goalsByPlayer.values());
  if (topGoalCount <= 0) return new Set<string>();

  return new Set(
    [...goalsByPlayer.entries()]
      .filter(([, goals]) => goals === topGoalCount)
      .map(([playerId]) => playerId),
  );
};

const honourPriority: Record<PlayerHonourKind, number> = {
  GOLDEN_BOOT: 0,
  LEAGUE_CHAMPION: 1,
  LEAGUE_RUNNER_UP: 2,
};

export const getPlayerHonours = (entityOrPlayerId: string): PlayerHonour[] => {
  const history = getPlayerHistory(entityOrPlayerId);
  const honours: PlayerHonour[] = [];

  history.forEach((record) => {
    if (record.season.status !== 'completed') return;

    const representedTeamIds = getRepresentedTeamIds(record);
    const representedLeagues = new Set<LeagueId>();
    representedTeamIds.forEach((teamId) => {
      const team = record.data.teamMap[teamId];
      if (team) representedLeagues.add(team.leagueId);
    });

    representedLeagues.forEach((leagueId) => {
      const leagueConfig = record.season.leagues[leagueId];
      if (!leagueConfig) return;

      const standings = calculateLeagueTable({
        league: leagueId,
        teams: record.data.teams,
        matches: record.data.matches,
        matchEvents: record.data.matchEvents,
        rules: record.season.rules,
        leagueConfig,
      });

      standings.forEach((standing) => {
        if (!representedTeamIds.has(standing.teamId)) return;
        if (standing.rank !== 1 && standing.rank !== 2) return;

        const team = record.data.teamMap[standing.teamId];
        if (!team) return;
        const kind: PlayerHonourKind = standing.rank === 1
          ? 'LEAGUE_CHAMPION'
          : 'LEAGUE_RUNNER_UP';

        honours.push({
          id: `${record.seasonId}:${leagueId}:${kind}:${team.id}`,
          seasonId: record.seasonId,
          seasonName: record.season.shortName,
          leagueId,
          kind,
          title: standing.rank === 1 ? '聯賽冠軍' : '聯賽亞軍',
          teamId: team.id,
          teamName: team.name,
        });
      });

      if (getTopScorerIds(record, leagueId).has(record.player.id)) {
        honours.push({
          id: `${record.seasonId}:${leagueId}:GOLDEN_BOOT:${record.player.id}`,
          seasonId: record.seasonId,
          seasonName: record.season.shortName,
          leagueId,
          kind: 'GOLDEN_BOOT',
          title: '金靴獎',
        });
      }
    });
  });

  return honours.sort(
    (a, b) =>
      b.seasonId.localeCompare(a.seasonId) ||
      a.leagueId.localeCompare(b.leagueId) ||
      honourPriority[a.kind] - honourPriority[b.kind] ||
      a.id.localeCompare(b.id),
  );
};
