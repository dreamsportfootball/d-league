export type CupGroup = 'A' | 'B';
export type CupCompetition = 'CUP' | 'PLATE';
export type CupGroupTieBreakStatus = 'RESOLVED' | 'PENALTY_SHOOTOUT_REQUIRED';

export interface CupTeam {
  id: string;
  name: string;
  group: CupGroup;
}

export interface CupMatch {
  id: number;
  round: string;
  timestamp: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  homePenalty?: number;
  awayPenalty?: number;
  status: 'SCHEDULED' | 'FINISHED';
  venue: 'A' | 'B';
}

export interface CupGroupStanding {
  rank: number;
  team: CupTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  headToHeadPoints: number;
  tieBreakStatus: CupGroupTieBreakStatus;
}

export interface CupGroupQualifier {
  group: CupGroup;
  rank: 1 | 2 | 3 | 4;
}

export interface CupSemifinalPairing {
  matchId: number;
  competition: CupCompetition;
  home: CupGroupQualifier;
  away: CupGroupQualifier;
}

export interface CupGroupPenaltyShootoutDecision {
  group: CupGroup;
  teamIds: readonly string[];
  orderedTeamIds: readonly string[];
}

export interface CupEventConfig {
  name: string;
  shortName: string;
  date: string;
  venue: string;
  format: string;
  teamCount: number;
  matchCount: number;
  matchesPerTeam: number;
  groupPoints: {
    win: number;
    draw: number;
    loss: number;
  };
  cupFinalMatchId: number;
  cupThirdPlaceMatchId: number;
  plateFinalMatchId: number;
  plateThirdPlaceMatchId: number;
  heroImage: string;
  highlightImages: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
}

export const CUP_GROUP_RANKING_RULE_LABEL =
  '小組排名依積分、相關球隊對戰成績、淨勝球、總進球數；全部相同以 PK 點球大戰決定';

const useOptimizedCupImages = import.meta.env.VITE_USE_OPTIMIZED_IMAGES === 'true';
const cupImagePath = (path: string): string =>
  useOptimizedCupImages ? path.replace(/\.(png|jpe?g)$/i, '.webp') : path;

export const CUP_EVENT: CupEventConfig = {
  name: '2026 台南夢達新春賀歲盃',
  shortName: '2026 新春賀歲盃',
  date: '2026-02-01T09:00:00+08:00',
  venue: '台南市立仁德文賢國中',
  format: '五人制｜小組賽＋盃／盤賽',
  teamCount: 8,
  matchCount: 20,
  matchesPerTeam: 5,
  groupPoints: {
    win: 3,
    draw: 1,
    loss: 0,
  },
  cupFinalMatchId: 20,
  cupThirdPlaceMatchId: 19,
  plateFinalMatchId: 17,
  plateThirdPlaceMatchId: 18,
  heroImage: cupImagePath('assets/cup/cup_award.jpg'),
  highlightImages: [
    { id: 1, src: cupImagePath('assets/cup/cup_01.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間一' },
    { id: 2, src: cupImagePath('assets/cup/cup_02.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間二' },
    { id: 3, src: cupImagePath('assets/cup/cup_03.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間三' },
    { id: 4, src: cupImagePath('assets/cup/cup_04.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間四' },
    { id: 5, src: cupImagePath('assets/cup/cup_05.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間五' },
    { id: 6, src: cupImagePath('assets/cup/cup_06.jpg'), alt: '2026 新春賀歲盃比賽精彩瞬間六' },
  ],
};

const CUP_TEAM_DEFINITIONS: Record<string, CupTeam> = {
  KAFC: { id: 'KAFC', name: 'KAFC', group: 'A' },
  DONG_GAO: { id: 'DONG_GAO', name: '東高 FC', group: 'A' },
  TN_SENIOR: { id: 'TN_SENIOR', name: '台南長青俱樂部', group: 'A' },
  DONG_GANG: { id: 'DONG_GANG', name: '東港足球隊', group: 'A' },
  LANDEN: { id: 'LANDEN', name: 'Landen United', group: 'B' },
  HAPPY_NEW_YEAR: { id: 'HAPPY_NEW_YEAR', name: '新年快快樂樂', group: 'B' },
  TNSCF: { id: 'TNSCF', name: 'TNSCF Eagles', group: 'B' },
  WORKER: { id: 'WORKER', name: '歹命打工人', group: 'B' },
};

export const CUP_MATCHES: CupMatch[] = [
  { id: 1, round: '小組賽 R1', timestamp: '2026-02-01T09:00:00+08:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 1, awayScore: 1 },
  { id: 2, round: '小組賽 R1', timestamp: '2026-02-01T09:00:00+08:00', venue: 'B', homeTeamId: 'TN_SENIOR', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 1, awayScore: 6 },
  { id: 3, round: '小組賽 R2', timestamp: '2026-02-01T09:30:00+08:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'HAPPY_NEW_YEAR', status: 'FINISHED', homeScore: 0, awayScore: 10 },
  { id: 4, round: '小組賽 R2', timestamp: '2026-02-01T09:30:00+08:00', venue: 'B', homeTeamId: 'TNSCF', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 2, awayScore: 0 },
  { id: 5, round: '小組賽 R3', timestamp: '2026-02-01T10:00:00+08:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'TN_SENIOR', status: 'FINISHED', homeScore: 1, awayScore: 6 },
  { id: 6, round: '小組賽 R3', timestamp: '2026-02-01T10:00:00+08:00', venue: 'B', homeTeamId: 'DONG_GAO', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 2, awayScore: 5 },
  { id: 7, round: '小組賽 R4', timestamp: '2026-02-01T10:30:00+08:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 0, awayScore: 7 },
  { id: 8, round: '小組賽 R4', timestamp: '2026-02-01T10:30:00+08:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 2, awayScore: 0 },
  { id: 9, round: '小組賽 R5', timestamp: '2026-02-01T11:00:00+08:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 3, awayScore: 5 },
  { id: 10, round: '小組賽 R5', timestamp: '2026-02-01T11:00:00+08:00', venue: 'B', homeTeamId: 'DONG_GAO', awayTeamId: 'TN_SENIOR', status: 'FINISHED', homeScore: 2, awayScore: 1 },
  { id: 11, round: '小組賽 R6', timestamp: '2026-02-01T11:30:00+08:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 0, awayScore: 6 },
  { id: 12, round: '小組賽 R6', timestamp: '2026-02-01T11:30:00+08:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 2, awayScore: 1 },
  { id: 13, round: '盤賽準決賽', timestamp: '2026-02-01T13:30:00+08:00', venue: 'A', homeTeamId: 'TN_SENIOR', awayTeamId: 'LANDEN', status: 'FINISHED', homeScore: 7, awayScore: 0 },
  { id: 14, round: '盤賽準決賽', timestamp: '2026-02-01T13:30:00+08:00', venue: 'B', homeTeamId: 'WORKER', awayTeamId: 'KAFC', status: 'FINISHED', homeScore: 3, awayScore: 1 },
  { id: 15, round: '盃賽準決賽', timestamp: '2026-02-01T14:00:00+08:00', venue: 'A', homeTeamId: 'DONG_GANG', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 3, awayScore: 1 },
  { id: 16, round: '盃賽準決賽', timestamp: '2026-02-01T14:00:00+08:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 6, awayScore: 1 },
  { id: 17, round: '盤賽決賽', timestamp: '2026-02-01T14:30:00+08:00', venue: 'A', homeTeamId: 'TN_SENIOR', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 1, awayScore: 0 },
  { id: 18, round: '盤賽季軍', timestamp: '2026-02-01T14:30:00+08:00', venue: 'B', homeTeamId: 'LANDEN', awayTeamId: 'KAFC', status: 'FINISHED', homeScore: 1, awayScore: 1, homePenalty: 1, awayPenalty: 3 },
  { id: 19, round: '盃賽季軍', timestamp: '2026-02-01T15:00:00+08:00', venue: 'A', homeTeamId: 'TNSCF', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 2, awayScore: 0 },
  { id: 20, round: '盃賽決賽', timestamp: '2026-02-01T15:30:00+08:00', venue: 'A', homeTeamId: 'DONG_GANG', awayTeamId: 'HAPPY_NEW_YEAR', status: 'FINISHED', homeScore: 2, awayScore: 1 },
];

export const CUP_SEMIFINAL_PAIRINGS: readonly CupSemifinalPairing[] = [
  { matchId: 15, competition: 'CUP', home: { group: 'A', rank: 1 }, away: { group: 'B', rank: 2 } },
  { matchId: 16, competition: 'CUP', home: { group: 'B', rank: 1 }, away: { group: 'A', rank: 2 } },
  { matchId: 13, competition: 'PLATE', home: { group: 'A', rank: 3 }, away: { group: 'B', rank: 4 } },
  { matchId: 14, competition: 'PLATE', home: { group: 'B', rank: 3 }, away: { group: 'A', rank: 4 } },
];

export const CUP_GROUP_PENALTY_SHOOTOUT_DECISIONS: readonly CupGroupPenaltyShootoutDecision[] = [];

type MutableCupGroupStanding = Omit<
  CupGroupStanding,
  'rank' | 'headToHeadPoints' | 'tieBreakStatus'
>;

const groupStageMatches = CUP_MATCHES.filter((match) => match.round.startsWith('小組賽'));
const teamDefinitionOrder = new Map(
  Object.keys(CUP_TEAM_DEFINITIONS).map((teamId, index) => [teamId, index]),
);

const calculateHeadToHeadPoints = (teamIds: readonly string[]): Map<string, number> => {
  const teamIdSet = new Set(teamIds);
  const points = new Map(teamIds.map((teamId) => [teamId, 0]));

  groupStageMatches.forEach((match) => {
    if (!teamIdSet.has(match.homeTeamId) || !teamIdSet.has(match.awayTeamId)) return;
    if (match.homeScore === undefined || match.awayScore === undefined) return;

    if (match.homeScore > match.awayScore) {
      points.set(match.homeTeamId, (points.get(match.homeTeamId) ?? 0) + CUP_EVENT.groupPoints.win);
      points.set(match.awayTeamId, (points.get(match.awayTeamId) ?? 0) + CUP_EVENT.groupPoints.loss);
    } else if (match.homeScore < match.awayScore) {
      points.set(match.awayTeamId, (points.get(match.awayTeamId) ?? 0) + CUP_EVENT.groupPoints.win);
      points.set(match.homeTeamId, (points.get(match.homeTeamId) ?? 0) + CUP_EVENT.groupPoints.loss);
    } else {
      points.set(match.homeTeamId, (points.get(match.homeTeamId) ?? 0) + CUP_EVENT.groupPoints.draw);
      points.set(match.awayTeamId, (points.get(match.awayTeamId) ?? 0) + CUP_EVENT.groupPoints.draw);
    }
  });

  return points;
};

const getPenaltyShootoutDecision = (
  group: CupGroup,
  teamIds: readonly string[],
): CupGroupPenaltyShootoutDecision | undefined => {
  const normalizedTeamIds = [...teamIds].sort().join('|');
  return CUP_GROUP_PENALTY_SHOOTOUT_DECISIONS.find(
    (decision) =>
      decision.group === group &&
      [...decision.teamIds].sort().join('|') === normalizedTeamIds,
  );
};

const calculateCupGroupStandings = (group: CupGroup): CupGroupStanding[] => {
  const rows = new Map<string, MutableCupGroupStanding>();

  Object.values(CUP_TEAM_DEFINITIONS)
    .filter((team) => team.group === group)
    .forEach((team) => {
      rows.set(team.id, {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    });

  groupStageMatches.forEach((match) => {
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (!home || !away || match.homeScore === undefined || match.awayScore === undefined) return;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += CUP_EVENT.groupPoints.win;
      away.points += CUP_EVENT.groupPoints.loss;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += CUP_EVENT.groupPoints.win;
      home.points += CUP_EVENT.groupPoints.loss;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += CUP_EVENT.groupPoints.draw;
      away.points += CUP_EVENT.groupPoints.draw;
    }
  });

  const completedRows = [...rows.values()].map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));
  const pointTotals = [...new Set(completedRows.map((row) => row.points))].sort((a, b) => b - a);
  const standings: CupGroupStanding[] = [];
  let nextRank = 1;

  pointTotals.forEach((pointTotal) => {
    const tiedRows = completedRows.filter((row) => row.points === pointTotal);
    const headToHeadPoints = calculateHeadToHeadPoints(tiedRows.map((row) => row.team.id));
    const orderedRows = tiedRows
      .map((row) => ({
        row,
        headToHeadPoints: tiedRows.length > 1 ? headToHeadPoints.get(row.team.id) ?? 0 : 0,
      }))
      .sort((a, b) =>
        b.headToHeadPoints - a.headToHeadPoints ||
        b.row.goalDifference - a.row.goalDifference ||
        b.row.goalsFor - a.row.goalsFor ||
        (teamDefinitionOrder.get(a.row.team.id) ?? 0) -
          (teamDefinitionOrder.get(b.row.team.id) ?? 0),
      );

    const criteriaBuckets = new Map<string, typeof orderedRows>();
    orderedRows.forEach((entry) => {
      const key = `${entry.headToHeadPoints}|${entry.row.goalDifference}|${entry.row.goalsFor}`;
      const bucket = criteriaBuckets.get(key) ?? [];
      bucket.push(entry);
      criteriaBuckets.set(key, bucket);
    });

    criteriaBuckets.forEach((bucket) => {
      if (bucket.length === 1) {
        const entry = bucket[0];
        standings.push({
          ...entry.row,
          rank: nextRank,
          headToHeadPoints: entry.headToHeadPoints,
          tieBreakStatus: 'RESOLVED',
        });
        nextRank += 1;
        return;
      }

      const decision = getPenaltyShootoutDecision(group, bucket.map((entry) => entry.row.team.id));
      if (decision) {
        const decisionOrder = new Map(decision.orderedTeamIds.map((teamId, index) => [teamId, index]));
        bucket
          .slice()
          .sort(
            (a, b) =>
              (decisionOrder.get(a.row.team.id) ?? Number.MAX_SAFE_INTEGER) -
              (decisionOrder.get(b.row.team.id) ?? Number.MAX_SAFE_INTEGER),
          )
          .forEach((entry, index) => {
            standings.push({
              ...entry.row,
              rank: nextRank + index,
              headToHeadPoints: entry.headToHeadPoints,
              tieBreakStatus: 'RESOLVED',
            });
          });
      } else {
        bucket
          .slice()
          .sort(
            (a, b) =>
              (teamDefinitionOrder.get(a.row.team.id) ?? 0) -
              (teamDefinitionOrder.get(b.row.team.id) ?? 0),
          )
          .forEach((entry) => {
            standings.push({
              ...entry.row,
              rank: nextRank,
              headToHeadPoints: entry.headToHeadPoints,
              tieBreakStatus: 'PENALTY_SHOOTOUT_REQUIRED',
            });
          });
      }

      nextRank += bucket.length;
    });
  });

  return standings;
};

export const CUP_GROUP_STANDINGS: Record<CupGroup, CupGroupStanding[]> = {
  A: calculateCupGroupStandings('A'),
  B: calculateCupGroupStandings('B'),
};

export const getCupQualifierTeamId = ({
  group,
  rank,
}: CupGroupQualifier): string | null =>
  CUP_GROUP_STANDINGS[group].find((standing) => standing.rank === rank)?.team.id ?? null;

export const CUP_TEAMS: Record<string, CupTeam> = Object.fromEntries(
  [...CUP_GROUP_STANDINGS.A, ...CUP_GROUP_STANDINGS.B].map((standing) => [
    standing.team.id,
    standing.team,
  ]),
);
