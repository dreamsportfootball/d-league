export interface CupTeam {
    id: string;
    name: string;
    group: 'A' | 'B';
}

export interface CupMatch {
    id: number;
    round: string;
    timestamp: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore?: number;
    awayScore?: number;
    // ✅ 新增：PK 比分欄位 (可選)
    homePenalty?: number;
    awayPenalty?: number;
    status: 'SCHEDULED' | 'FINISHED';
    venue: 'A' | 'B';
}

// 1. 參賽球隊名單
export const CUP_TEAMS: Record<string, CupTeam> = {
    // A 組
    'KAFC': { id: 'KAFC', name: 'KAFC', group: 'A' },
    'DONG_GAO': { id: 'DONG_GAO', name: '東高 FC', group: 'A' },
    'TN_SENIOR': { id: 'TN_SENIOR', name: '台南長青俱樂部', group: 'A' },
    'DONG_GANG': { id: 'DONG_GANG', name: '東港足球隊', group: 'A' },

    // B 組
    'LANDEN': { id: 'LANDEN', name: 'Landen United', group: 'B' },
    'HAPPY_NEW_YEAR': { id: 'HAPPY_NEW_YEAR', name: '新年快快樂樂', group: 'B' },
    'TNSCF': { id: 'TNSCF', name: 'TNSCF Eagles', group: 'B' },
    'WORKER': { id: 'WORKER', name: '歹命打工人', group: 'B' },
};

// 2. 完整賽程表 (2026.02.01) - 包含最終賽果
export const CUP_MATCHES: CupMatch[] = [
    // ... (前面的比賽保持不變) ...
    { id: 1, round: '小組賽 R1', timestamp: '2026-02-01T09:00:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 1, awayScore: 1 },
    { id: 2, round: '小組賽 R1', timestamp: '2026-02-01T09:00:00', venue: 'B', homeTeamId: 'TN_SENIOR', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 1, awayScore: 6 },
    { id: 3, round: '小組賽 R2', timestamp: '2026-02-01T09:30:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'HAPPY_NEW_YEAR', status: 'FINISHED', homeScore: 0, awayScore: 10 },
    { id: 4, round: '小組賽 R2', timestamp: '2026-02-01T09:30:00', venue: 'B', homeTeamId: 'TNSCF', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 2, awayScore: 0 },
    { id: 5, round: '小組賽 R3', timestamp: '2026-02-01T10:00:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'TN_SENIOR', status: 'FINISHED', homeScore: 1, awayScore: 6 },
    { id: 6, round: '小組賽 R3', timestamp: '2026-02-01T10:00:00', venue: 'B', homeTeamId: 'DONG_GAO', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 2, awayScore: 5 },
    { id: 7, round: '小組賽 R4', timestamp: '2026-02-01T10:30:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 0, awayScore: 7 },
    { id: 8, round: '小組賽 R4', timestamp: '2026-02-01T10:30:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 2, awayScore: 0 },
    { id: 9, round: '小組賽 R5', timestamp: '2026-02-01T11:00:00', venue: 'A', homeTeamId: 'KAFC', awayTeamId: 'DONG_GANG', status: 'FINISHED', homeScore: 3, awayScore: 5 },
    { id: 10, round: '小組賽 R5', timestamp: '2026-02-01T11:00:00', venue: 'B', homeTeamId: 'DONG_GAO', awayTeamId: 'TN_SENIOR', status: 'FINISHED', homeScore: 2, awayScore: 1 },
    { id: 11, round: '小組賽 R6', timestamp: '2026-02-01T11:30:00', venue: 'A', homeTeamId: 'LANDEN', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 0, awayScore: 6 },
    { id: 12, round: '小組賽 R6', timestamp: '2026-02-01T11:30:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 2, awayScore: 1 },

    // --- 淘汰賽階段 ---
    { id: 13, round: '盤賽準決賽', timestamp: '2026-02-01T13:30:00', venue: 'A', homeTeamId: 'TN_SENIOR', awayTeamId: 'LANDEN', status: 'FINISHED', homeScore: 7, awayScore: 0 },
    { id: 14, round: '盤賽準決賽', timestamp: '2026-02-01T13:30:00', venue: 'B', homeTeamId: 'WORKER', awayTeamId: 'KAFC', status: 'FINISHED', homeScore: 3, awayScore: 1 },
    { id: 15, round: '盃賽準決賽', timestamp: '2026-02-01T14:00:00', venue: 'A', homeTeamId: 'DONG_GANG', awayTeamId: 'TNSCF', status: 'FINISHED', homeScore: 3, awayScore: 1 },
    { id: 16, round: '盃賽準決賽', timestamp: '2026-02-01T14:00:00', venue: 'B', homeTeamId: 'HAPPY_NEW_YEAR', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 6, awayScore: 1 },
    { id: 17, round: '盤賽決賽', timestamp: '2026-02-01T14:30:00', venue: 'A', homeTeamId: 'TN_SENIOR', awayTeamId: 'WORKER', status: 'FINISHED', homeScore: 1, awayScore: 0 },
    
    // ✅ 修改：盤賽季軍加入 PK 比分 (1-3)
    {
        id: 18,
        round: '盤賽季軍',
        timestamp: '2026-02-01T14:30:00',
        venue: 'B',
        homeTeamId: 'LANDEN',
        awayTeamId: 'KAFC',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenalty: 1, // Landen PK 得分
        awayPenalty: 3  // KAFC PK 得分
    },

    { id: 19, round: '盃賽季軍', timestamp: '2026-02-01T15:00:00', venue: 'A', homeTeamId: 'TNSCF', awayTeamId: 'DONG_GAO', status: 'FINISHED', homeScore: 2, awayScore: 0 },
    { id: 20, round: '盃賽決賽', timestamp: '2026-02-01T15:30:00', venue: 'A', homeTeamId: 'DONG_GANG', awayTeamId: 'HAPPY_NEW_YEAR', status: 'FINISHED', homeScore: 2, awayScore: 1 }
];
