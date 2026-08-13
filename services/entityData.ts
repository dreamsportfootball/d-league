import { getSeasonConfig } from '../config/seasons';
import { SEASON_IDS } from '../config/siteManifest.js';
import { MatchStatus, type Match } from '../types';
import type { MatchEvent } from '../types/matchEvent';
import type { PlayerProfile } from '../types/player';
import type { SeasonConfig, SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';
import { getSeasonData, type SeasonData } from './seasonDataJson';

export interface TeamSeasonRecord {
  seasonId: SeasonId;
  season: SeasonConfig;
  data: SeasonData;
  team: SeasonTeam;
}

export interface PlayerSeasonRecord {
  seasonId: SeasonId;
  season: SeasonConfig;
  data: SeasonData;
  player: PlayerProfile;
  team?: SeasonTeam;
}

export interface MatchRecord {
  seasonId: SeasonId;
  season: SeasonConfig;
  data: SeasonData;
  match: Match;
  homeTeam?: SeasonTeam;
  awayTeam?: SeasonTeam;
  events: MatchEvent[];
}

export interface PlayerSeasonStats {
  goals: number;
  yellowCards: number;
  secondYellowDismissals: number;
  directRedCards: number;
  eventMatches: number;
}

export interface RoundInsights {
  completedMatches: number;
  totalGoals: number;
  averageGoals: number;
  biggestMargin: number;
  biggestMatchIds: string[];
  topScorer?: { playerId?: string; name: string; goals: number };
}

const seasonIds = SEASON_IDS as readonly SeasonId[];

export const getTeamIdentity = (team: SeasonTeam): string => team.identityId ?? team.id;
export const getPlayerIdentity = (player: PlayerProfile): string => player.identityId ?? player.id;

const seasonSort = (a: SeasonId, b: SeasonId): number => b.localeCompare(a);

export const resolveMatchEventPlayer = (
  data: SeasonData,
  match: Match,
  event: MatchEvent,
): PlayerProfile | undefined => {
  const explicitId = event.playerId ?? event.subjectId;
  if (explicitId) return data.players.find((player) => player.id === explicitId);

  const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
  const candidates = data.players.filter((player) => player.name === event.player);
  return candidates.find((player) => player.teamId === eventTeamId) ??
    (candidates.length === 1 ? candidates[0] : undefined);
};

export const getTeamHistory = (entityOrTeamId: string): TeamSeasonRecord[] => {
  let identityId = entityOrTeamId;

  for (const seasonId of seasonIds) {
    const exact = getSeasonData(seasonId).teams.find(
      (team) => team.id === entityOrTeamId || team.identityId === entityOrTeamId,
    );
    if (exact) {
      identityId = getTeamIdentity(exact);
      break;
    }
  }

  return seasonIds
    .flatMap((seasonId) => {
      const data = getSeasonData(seasonId);
      const team = data.teams.find(
        (candidate) =>
          getTeamIdentity(candidate) === identityId ||
          candidate.id === entityOrTeamId ||
          candidate.identityId === entityOrTeamId,
      );
      return team
        ? [{ seasonId, season: getSeasonConfig(seasonId), data, team }]
        : [];
    })
    .sort((a, b) => seasonSort(a.seasonId, b.seasonId));
};

export const getPlayerHistory = (entityOrPlayerId: string): PlayerSeasonRecord[] => {
  let identityId = entityOrPlayerId;

  for (const seasonId of seasonIds) {
    const exact = getSeasonData(seasonId).players.find(
      (player) => player.id === entityOrPlayerId || player.identityId === entityOrPlayerId,
    );
    if (exact) {
      identityId = getPlayerIdentity(exact);
      break;
    }
  }

  return seasonIds
    .flatMap((seasonId) => {
      const data = getSeasonData(seasonId);
      const player = data.players.find(
        (candidate) =>
          getPlayerIdentity(candidate) === identityId ||
          candidate.id === entityOrPlayerId ||
          candidate.identityId === entityOrPlayerId,
      );
      if (!player) return [];
      return [{
        seasonId,
        season: getSeasonConfig(seasonId),
        data,
        player,
        team: data.teamMap[player.teamId],
      }];
    })
    .sort((a, b) => seasonSort(a.seasonId, b.seasonId));
};

export const getMatchRecord = (
  matchId: string,
  preferredSeasonId?: SeasonId,
): MatchRecord | null => {
  const ordered = preferredSeasonId
    ? [preferredSeasonId, ...seasonIds.filter((seasonId) => seasonId !== preferredSeasonId)]
    : [...seasonIds].sort(seasonSort);

  for (const seasonId of ordered) {
    const data = getSeasonData(seasonId);
    const match = data.matches.find((candidate) => candidate.id === matchId);
    if (!match) continue;
    return {
      seasonId,
      season: getSeasonConfig(seasonId),
      data,
      match,
      homeTeam: data.teamMap[match.homeTeamId],
      awayTeam: data.teamMap[match.awayTeamId],
      events: [...(data.matchEvents[match.id] ?? [])].sort(
        (a, b) => a.minute - b.minute || a.id.localeCompare(b.id),
      ),
    };
  }

  return null;
};

export const getPlayerSeasonStats = (
  record: PlayerSeasonRecord,
  teamId?: string,
): PlayerSeasonStats => {
  let goals = 0;
  let yellowCards = 0;
  let secondYellowDismissals = 0;
  let directRedCards = 0;
  const matchIds = new Set<string>();

  Object.entries(record.data.matchEvents).forEach(([matchId, events]) => {
    const match = record.data.matches.find((candidate) => candidate.id === matchId);
    if (!match) return;

    events.forEach((event) => {
      const resolvedPlayer = resolveMatchEventPlayer(record.data, match, event);
      if (resolvedPlayer?.id !== record.player.id) return;

      const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
      if (teamId && eventTeamId !== teamId) return;

      matchIds.add(matchId);
      if (
        event.type === 'GOAL' &&
        !event.isOwnGoal &&
        match.resultType !== 'VOID' &&
        match.countsForPlayerStats !== false
      ) goals += 1;
      if (event.type === 'YELLOW_CARD') yellowCards += 1;
      if (event.type === 'SECOND_YELLOW') {
        yellowCards += 1;
        secondYellowDismissals += 1;
      }
      if (event.type === 'RED_CARD') directRedCards += 1;
    });
  });

  return {
    goals,
    yellowCards,
    secondYellowDismissals,
    directRedCards,
    eventMatches: matchIds.size,
  };
};

export const getPlayerMatchRecords = (entityOrPlayerId: string): MatchRecord[] => {
  const history = getPlayerHistory(entityOrPlayerId);
  const results: MatchRecord[] = [];

  history.forEach((record) => {
    Object.entries(record.data.matchEvents).forEach(([matchId, events]) => {
      const match = record.data.matches.find((candidate) => candidate.id === matchId);
      if (!match) return;
      const involved = events.some(
        (event) => resolveMatchEventPlayer(record.data, match, event)?.id === record.player.id,
      );
      if (!involved) return;
      const matchRecord = getMatchRecord(matchId, record.seasonId);
      if (matchRecord) results.push(matchRecord);
    });
  });

  return results.sort(
    (a, b) => new Date(b.match.timestamp).getTime() - new Date(a.match.timestamp).getTime(),
  );
};

export const getRoundInsights = (record: MatchRecord): RoundInsights => {
  const matches = record.data.matches.filter(
    (match) =>
      match.league === record.match.league &&
      String(match.round) === String(record.match.round) &&
      match.status === MatchStatus.FINISHED &&
      match.homeScore !== null &&
      match.awayScore !== null,
  );

  const totalGoals = matches.reduce(
    (sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0),
    0,
  );
  const biggestMargin = matches.reduce(
    (max, match) => Math.max(max, Math.abs((match.homeScore ?? 0) - (match.awayScore ?? 0))),
    0,
  );
  const biggestMatchIds = matches
    .filter(
      (match) => Math.abs((match.homeScore ?? 0) - (match.awayScore ?? 0)) === biggestMargin,
    )
    .map((match) => match.id);

  const scorerMap = new Map<string, { playerId?: string; name: string; goals: number }>();
  matches.forEach((match) => {
    (record.data.matchEvents[match.id] ?? []).forEach((event) => {
      if (event.type !== 'GOAL' || event.isOwnGoal) return;
      const resolvedPlayer = resolveMatchEventPlayer(record.data, match, event);
      const key = resolvedPlayer?.id ?? event.playerId ?? event.subjectId ?? event.player;
      const existing = scorerMap.get(key);
      if (existing) {
        existing.goals += 1;
      } else {
        scorerMap.set(key, {
          playerId: resolvedPlayer?.id ?? event.playerId ?? event.subjectId,
          name: resolvedPlayer?.name ?? event.player,
          goals: 1,
        });
      }
    });
  });

  const topScorer = [...scorerMap.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'zh-TW'),
  )[0];

  return {
    completedMatches: matches.length,
    totalGoals,
    averageGoals: matches.length ? totalGoals / matches.length : 0,
    biggestMargin,
    biggestMatchIds,
    topScorer,
  };
};
