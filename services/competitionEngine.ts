import type { Match, Standing, StandingTieStatus } from '../types';
import { MatchStatus } from '../types';
import type { MatchEvent } from '../types/matchEvent';
import type { PlayerProfile } from '../types/player';
import type { CompetitionRules, LeagueConfig, LeagueId, RankingCriterion } from '../types/season';
import type { SeasonTeam } from '../types/team';

interface LeagueTableOptions {
  league: LeagueId;
  teams: SeasonTeam[];
  matches: Match[];
  matchEvents: Record<string, MatchEvent[]>;
  rules: CompetitionRules;
  leagueConfig?: LeagueConfig | null;
}

interface MiniTableRow {
  teamId: string;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}

export interface PlayerCompetitionStats {
  subjectId: string;
  name: string;
  teamId: string;
  goals: number;
  yellowCards: number;
  secondYellowDismissals: number;
  directRedCards: number;
  lastEventTimestamp: string;
}

const HEAD_TO_HEAD_CRITERIA: RankingCriterion[] = [
  'HEAD_TO_HEAD_POINTS',
  'HEAD_TO_HEAD_GOAL_DIFFERENCE',
  'HEAD_TO_HEAD_GOALS_FOR',
];

const isActiveTeam = (team: SeasonTeam): boolean => team.competitionStatus !== 'WITHDRAWN';

const isFinishedMatch = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED ||
  (match.homeScore !== null && match.awayScore !== null);

const countsForStandings = (match: Match, activeTeamIds: Set<string>): boolean =>
  isFinishedMatch(match) &&
  match.resultType !== 'VOID' &&
  match.countsForStandings !== false &&
  activeTeamIds.has(match.homeTeamId) &&
  activeTeamIds.has(match.awayTeamId);

const applyMatchToRows = <T extends Pick<Standing, 'teamId' | 'played' | 'won' | 'drawn' | 'lost' | 'gf' | 'ga' | 'gd' | 'points' | 'form'>>(
  match: Match,
  home: T,
  away: T,
  rules: CompetitionRules,
): void => {
  home.played += 1;
  away.played += 1;

  if (match.resultType === 'DOUBLE_FORFEIT') {
    home.lost += 1;
    away.lost += 1;
    home.points += rules.lossPoints;
    away.points += rules.lossPoints;
    home.form.unshift('L');
    away.form.unshift('L');
    return;
  }

  if (match.homeScore === null || match.awayScore === null) return;

  home.gf += match.homeScore;
  home.ga += match.awayScore;
  away.gf += match.awayScore;
  away.ga += match.homeScore;
  home.gd = home.gf - home.ga;
  away.gd = away.gf - away.ga;

  if (match.homeScore > match.awayScore) {
    home.won += 1;
    away.lost += 1;
    home.points += rules.winPoints;
    away.points += rules.lossPoints;
    home.form.unshift('W');
    away.form.unshift('L');
  } else if (match.homeScore < match.awayScore) {
    away.won += 1;
    home.lost += 1;
    away.points += rules.winPoints;
    home.points += rules.lossPoints;
    away.form.unshift('W');
    home.form.unshift('L');
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += rules.drawPoints;
    away.points += rules.drawPoints;
    home.form.unshift('D');
    away.form.unshift('D');
  }
};

const buildMiniTable = (
  teamIds: string[],
  matches: Match[],
  rules: CompetitionRules,
): Record<string, MiniTableRow> => {
  const idSet = new Set(teamIds);
  const rows: Record<string, MiniTableRow> = Object.fromEntries(
    teamIds.map((teamId) => [teamId, { teamId, points: 0, gf: 0, ga: 0, gd: 0 }]),
  );

  matches
    .filter((match) => idSet.has(match.homeTeamId) && idSet.has(match.awayTeamId))
    .forEach((match) => {
      const home = rows[match.homeTeamId];
      const away = rows[match.awayTeamId];
      if (!home || !away) return;

      if (match.resultType === 'DOUBLE_FORFEIT') {
        home.points += rules.lossPoints;
        away.points += rules.lossPoints;
        return;
      }

      if (match.homeScore === null || match.awayScore === null) return;
      home.gf += match.homeScore;
      home.ga += match.awayScore;
      away.gf += match.awayScore;
      away.ga += match.homeScore;
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (match.homeScore > match.awayScore) {
        home.points += rules.winPoints;
        away.points += rules.lossPoints;
      } else if (match.homeScore < match.awayScore) {
        away.points += rules.winPoints;
        home.points += rules.lossPoints;
      } else {
        home.points += rules.drawPoints;
        away.points += rules.drawPoints;
      }
    });

  return rows;
};

const criterionValue = (
  row: Standing,
  criterion: RankingCriterion,
  miniTable?: Record<string, MiniTableRow>,
): number => {
  switch (criterion) {
    case 'GOAL_DIFFERENCE':
      return row.gd;
    case 'GOALS_FOR':
      return row.gf;
    case 'HEAD_TO_HEAD_POINTS':
      return miniTable?.[row.teamId]?.points ?? 0;
    case 'HEAD_TO_HEAD_GOAL_DIFFERENCE':
      return miniTable?.[row.teamId]?.gd ?? 0;
    case 'HEAD_TO_HEAD_GOALS_FOR':
      return miniTable?.[row.teamId]?.gf ?? 0;
    case 'FEWEST_DIRECT_RED':
      return row.directRedCards;
    case 'FEWEST_SECOND_YELLOW':
      return row.secondYellowDismissals;
    case 'FEWEST_YELLOW':
      return row.yellowCards;
    default:
      return 0;
  }
};

const isAscendingCriterion = (criterion: RankingCriterion): boolean =>
  criterion === 'FEWEST_DIRECT_RED' ||
  criterion === 'FEWEST_SECOND_YELLOW' ||
  criterion === 'FEWEST_YELLOW';

const partitionByCriterion = (
  rows: Standing[],
  criterion: RankingCriterion,
  miniTable?: Record<string, MiniTableRow>,
): Standing[][] => {
  const grouped = new Map<number, Standing[]>();
  rows.forEach((row) => {
    const value = criterionValue(row, criterion, miniTable);
    const list = grouped.get(value) ?? [];
    list.push(row);
    grouped.set(value, list);
  });

  const values = [...grouped.keys()].sort((a, b) =>
    isAscendingCriterion(criterion) ? a - b : b - a,
  );
  return values.map((value) => grouped.get(value) ?? []);
};

const resolveHeadToHead = (
  rows: Standing[],
  matches: Match[],
  rules: CompetitionRules,
): Standing[][] => {
  if (rows.length <= 1) return [rows];
  const miniTable = buildMiniTable(rows.map((row) => row.teamId), matches, rules);

  for (const criterion of HEAD_TO_HEAD_CRITERIA) {
    if (!rules.rankingCriteria.includes(criterion)) continue;
    const partitions = partitionByCriterion(rows, criterion, miniTable);
    if (partitions.length > 1) {
      return partitions.flatMap((partition) =>
        partition.length > 1 ? resolveHeadToHead(partition, matches, rules) : [partition],
      );
    }
  }

  return [rows];
};

const resolveByCriteria = (
  rows: Standing[],
  countedMatches: Match[],
  rules: CompetitionRules,
  startIndex = 0,
): Standing[][] => {
  if (rows.length <= 1) return [rows];

  for (let index = startIndex; index < rules.rankingCriteria.length; index += 1) {
    const criterion = rules.rankingCriteria[index];

    if (HEAD_TO_HEAD_CRITERIA.includes(criterion)) {
      const firstHeadToHeadIndex = rules.rankingCriteria.findIndex((item) =>
        HEAD_TO_HEAD_CRITERIA.includes(item),
      );
      if (index !== firstHeadToHeadIndex) continue;

      const headToHeadGroups = resolveHeadToHead(rows, countedMatches, rules);
      const afterHeadToHead = rules.rankingCriteria.reduce(
        (lastIndex, item, itemIndex) =>
          HEAD_TO_HEAD_CRITERIA.includes(item) ? Math.max(lastIndex, itemIndex + 1) : lastIndex,
        index + 1,
      );

      if (headToHeadGroups.length > 1) {
        return headToHeadGroups.flatMap((group) =>
          resolveByCriteria(group, countedMatches, rules, afterHeadToHead),
        );
      }

      index = afterHeadToHead - 1;
      continue;
    }

    const partitions = partitionByCriterion(rows, criterion);
    if (partitions.length > 1) {
      return partitions.flatMap((partition) =>
        resolveByCriteria(partition, countedMatches, rules, index + 1),
      );
    }
  }

  return [rows];
};

const isCriticalTie = (
  startRank: number,
  endRank: number,
  totalTeams: number,
  leagueConfig?: LeagueConfig | null,
): boolean => {
  if (startRank === 1) return true;
  const promotionPlaces = leagueConfig?.promotionPlaces ?? 0;
  if (promotionPlaces > 0 && startRank <= promotionPlaces && endRank > promotionPlaces) return true;

  const relegationPlaces = leagueConfig?.relegationPlaces ?? 0;
  if (relegationPlaces > 0) {
    const relegationStart = totalTeams - relegationPlaces + 1;
    if (startRank < relegationStart && endRank >= relegationStart) return true;
  }

  return false;
};

const assignRanks = (
  groups: Standing[][],
  teamsById: Record<string, SeasonTeam>,
  leagueConfig?: LeagueConfig | null,
): Standing[] => {
  const totalTeams = groups.reduce((sum, group) => sum + group.length, 0);
  let position = 1;
  const ranked: Standing[] = [];

  groups.forEach((group) => {
    const ordered = group.slice().sort((a, b) => {
      const aOrder = teamsById[a.teamId]?.manualTiebreakOrder;
      const bOrder = teamsById[b.teamId]?.manualTiebreakOrder;
      if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) return aOrder - bOrder;
      return (teamsById[a.teamId]?.name ?? a.teamId).localeCompare(
        teamsById[b.teamId]?.name ?? b.teamId,
        'zh-TW',
      );
    });

    const hasCompleteManualOrder = ordered.every(
      (row) => teamsById[row.teamId]?.manualTiebreakOrder !== undefined,
    );
    const unresolvedTie = ordered.length > 1 && !hasCompleteManualOrder;
    const tieStatus: StandingTieStatus = unresolvedTie
      ? isCriticalTie(position, position + ordered.length - 1, totalTeams, leagueConfig)
        ? 'DRAW_REQUIRED'
        : 'SHARED'
      : 'NONE';

    ordered.forEach((row, index) => {
      ranked.push({
        ...row,
        rank: hasCompleteManualOrder ? position + index : position,
        tieStatus,
      });
    });
    position += ordered.length;
  });

  return ranked;
};

export const calculateLeagueTable = ({
  league,
  teams,
  matches,
  matchEvents,
  rules,
  leagueConfig,
}: LeagueTableOptions): Standing[] => {
  const leagueTeams = teams.filter((team) => team.leagueId === league && isActiveTeam(team));
  const teamsById = Object.fromEntries(leagueTeams.map((team) => [team.id, team]));
  const activeTeamIds = new Set(leagueTeams.map((team) => team.id));

  const rows: Record<string, Standing> = Object.fromEntries(
    leagueTeams.map((team) => [
      team.id,
      {
        teamId: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: team.pointsAdjustment ?? 0,
        pointsAdjustment: team.pointsAdjustment ?? 0,
        directRedCards: 0,
        secondYellowDismissals: 0,
        yellowCards: 0,
        rank: 0,
        tieStatus: 'NONE' as const,
        form: [],
      },
    ]),
  );

  const countedMatches = matches.filter(
    (match) => match.league === league && countsForStandings(match, activeTeamIds),
  );

  countedMatches.forEach((match) => {
    const events = matchEvents[match.id] ?? [];
    events.forEach((event) => {
      const teamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
      const row = rows[teamId];
      if (!row) return;
      if (event.type === 'YELLOW_CARD') row.yellowCards += 1;
      if (event.type === 'SECOND_YELLOW') {
        row.yellowCards += 1;
        row.secondYellowDismissals += 1;
      }
      if (event.type === 'RED_CARD') row.directRedCards += 1;
    });
  });

  countedMatches
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((match) => {
      const home = rows[match.homeTeamId];
      const away = rows[match.awayTeamId];
      if (!home || !away) return;
      applyMatchToRows(match, home, away, rules);
    });

  const pointGroups = new Map<number, Standing[]>();
  Object.values(rows).forEach((row) => {
    const list = pointGroups.get(row.points) ?? [];
    list.push(row);
    pointGroups.set(row.points, list);
  });

  const resolvedGroups = [...pointGroups.keys()]
    .sort((a, b) => b - a)
    .flatMap((points) => resolveByCriteria(pointGroups.get(points) ?? [], countedMatches, rules));

  return assignRanks(resolvedGroups, teamsById, leagueConfig);
};

const resolveEventSubject = (
  event: MatchEvent,
  teamId: string,
  players: PlayerProfile[],
): { subjectId: string; name: string } => {
  const explicitId = event.playerId ?? event.subjectId;
  if (explicitId) {
    const player = players.find((item) => item.id === explicitId);
    return { subjectId: explicitId, name: player?.name ?? event.player };
  }

  const candidates = players.filter((player) => player.name === event.player);
  const teamCandidate = candidates.find((player) => player.teamId === teamId);
  const matched = teamCandidate ?? (candidates.length === 1 ? candidates[0] : undefined);
  return {
    subjectId: matched?.id ?? `legacy:${teamId}:${event.player}`,
    name: matched?.name ?? event.player,
  };
};

export const calculatePlayerCompetitionStats = (
  league: LeagueId,
  teams: SeasonTeam[],
  players: PlayerProfile[],
  matches: Match[],
  matchEvents: Record<string, MatchEvent[]>,
): PlayerCompetitionStats[] => {
  const activeTeamIds = new Set(
    teams.filter((team) => team.leagueId === league && isActiveTeam(team)).map((team) => team.id),
  );
  const stats = new Map<string, PlayerCompetitionStats>();

  matches
    .filter((match) => match.league === league)
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((match) => {
      const matchInvalidForGoals =
        match.resultType === 'VOID' ||
        match.countsForPlayerStats === false ||
        !activeTeamIds.has(match.homeTeamId) ||
        !activeTeamIds.has(match.awayTeamId);

      (matchEvents[match.id] ?? []).forEach((event) => {
        const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
        const subject = resolveEventSubject(event, eventTeamId, players);
        const key = `${subject.subjectId}:${eventTeamId}`;
        const row = stats.get(key) ?? {
          subjectId: subject.subjectId,
          name: subject.name,
          teamId: eventTeamId,
          goals: 0,
          yellowCards: 0,
          secondYellowDismissals: 0,
          directRedCards: 0,
          lastEventTimestamp: match.timestamp,
        };

        row.name = subject.name;
        row.lastEventTimestamp = match.timestamp;
        if (event.type === 'GOAL' && !event.isOwnGoal && !matchInvalidForGoals) row.goals += 1;
        if (event.type === 'YELLOW_CARD') row.yellowCards += 1;
        if (event.type === 'SECOND_YELLOW') {
          row.yellowCards += 1;
          row.secondYellowDismissals += 1;
        }
        if (event.type === 'RED_CARD') row.directRedCards += 1;
        stats.set(key, row);
      });
    });

  return [...stats.values()];
};
