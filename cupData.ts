export type CupGroup = 'A' | 'B';

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

export interface CupEventConfig {
  name: string;
  shortName: string;
  date: string;
  venue: string;
  format: string;
  teamCount: number;
  matchCount: number;
  matchesPerTeam: number;
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

export const CUP_EVENT: CupEventConfig = {
  name: '2026 台南夢達新春賀歲盃',
  shortName: '2026 新春賀歲盃',
  date: '2026-02-01T09:00:00+08:00',
  venue: '台南市立仁德文賢國中',
  format: '五人制｜小組賽＋盃／盤賽',
  teamCount: 8,
  matchCount: 20,
  matchesPerTeam: 5,
  cupFinalMatchId: 20,
  cupThirdPlaceMatchId: 19,
  plateFinalMatchId: 17,
  plateThirdPlaceMatchId: 18,
  heroImage: 'assets/cup/cup_award.jpg',
  highlightImages: [
    { id: 1, src: 'assets/cup/cup_01.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間一' },
    { id: 2, src: 'assets/cup/cup_02.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間二' },
    { id: 3, src: 'assets/cup/cup_03.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間三' },
    { id: 4, src: 'assets/cup/cup_04.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間四' },
    { id: 5, src: 'assets/cup/cup_05.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間五' },
    { id: 6, src: 'assets/cup/cup_06.jpg', alt: '2026 新春賀歲盃比賽精彩瞬間六' },
  ],
};

export const CUP_TEAMS: Record<string, CupTeam> = {
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
