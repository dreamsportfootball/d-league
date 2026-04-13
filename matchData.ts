// 檔案路徑：d-league web/matchData.ts

import { Match, MatchStatus, Video, MatchEvent } from './types';

const VENUE = '台南仁德文賢國中人工草';

// Helper to create date objects easily
const createDate = (dateStr: string, timeStr: string) => {
  const [year, month, day] = dateStr.split('/').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
};

// ==========================================
//   比賽賽程 (MATCHES)
// ==========================================
export const MATCHES: Match[] = [
  // Round 1 - 2025/10/19 (COMPLETED)
  { id: 'm1', round: 1, homeTeamId: 't_luzhu', awayTeamId: 't_pingtung', homeScore: 1, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2025/10/19', '10:00'), venue: VENUE, league: 'L2' },
  { id: 'm2', round: 1, homeTeamId: 't_crazydog', awayTeamId: 't_canglong', homeScore: 5, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/10/19', '11:00'), venue: VENUE, league: 'L2' },
  { id: 'm3', round: 1, homeTeamId: 't_chiayi', awayTeamId: 't_jiuhao', homeScore: 1, awayScore: 5, status: MatchStatus.FINISHED, timestamp: createDate('2025/10/19', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm4', round: 1, homeTeamId: 't_tongque', awayTeamId: 't_chen', homeScore: 0, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2025/10/19', '14:00'), venue: VENUE, league: 'L1' },
  { id: 'm5', round: 1, homeTeamId: 't_ppi', awayTeamId: 't_niaoshi', homeScore: 0, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2025/10/19', '15:00'), venue: VENUE, league: 'L2' },

  // Round 2 - 2025/11/02 (COMPLETED)
  { id: 'm6', round: 2, homeTeamId: 't_chiayi', awayTeamId: 't_chen', homeScore: 0, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/02', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm7', round: 2, homeTeamId: 't_ppi', awayTeamId: 't_luzhu', homeScore: 6, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/02', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm8', round: 2, homeTeamId: 't_crazydog', awayTeamId: 't_niaoshi', homeScore: 4, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/02', '15:00'), venue: VENUE, league: 'L2' },
  { id: 'm9', round: 2, homeTeamId: 't_canglong', awayTeamId: 't_pingtung', homeScore: 4, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/02', '16:00'), venue: VENUE, league: 'L2' },

  // Round 3 - 2025/11/16 (COMPLETED)
  { id: 'm10', round: 3, homeTeamId: 't_niaoshi', awayTeamId: 't_luzhu', homeScore: 4, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/16', '13:00'), venue: VENUE, league: 'L2' },
  { id: 'm11', round: 3, homeTeamId: 't_crazydog', awayTeamId: 't_pingtung', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/16', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm12', round: 2, homeTeamId: 't_jiuhao', awayTeamId: 't_tongque', homeScore: 2, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/16', '15:00'), venue: VENUE, league: 'L1' },
  { id: 'm13', round: 3, homeTeamId: 't_canglong', awayTeamId: 't_ppi', homeScore: 0, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2025/11/16', '16:00'), venue: VENUE, league: 'L2' },

  // Round 4 - 2025/12/07 (COMPLETED)
  { id: 'm14', round: 4, homeTeamId: 't_pingtung', awayTeamId: 't_ppi', homeScore: 0, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2025/12/07', '10:00'), venue: VENUE, league: 'L2' },
  { id: 'm15', round: 4, homeTeamId: 't_crazydog', awayTeamId: 't_luzhu', homeScore: 6, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2025/12/07', '11:00'), venue: VENUE, league: 'L2' },
  { id: 'm16', round: 3, homeTeamId: 't_chen', awayTeamId: 't_jiuhao', homeScore: 1, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2025/12/07', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm17', round: 3, homeTeamId: 't_chiayi', awayTeamId: 't_tongque', homeScore: 2, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/12/07', '14:00'), venue: VENUE, league: 'L1' },
  { id: 'm18', round: 4, homeTeamId: 't_niaoshi', awayTeamId: 't_canglong', homeScore: 0, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2025/12/07', '15:00'), venue: VENUE, league: 'L2' },

  // Round 5 - 2026/01/11 (COMPLETED)
  { id: 'm19', round: 4, homeTeamId: 't_jiuhao', awayTeamId: 't_chiayi', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2026/01/11', '10:00'), venue: VENUE, league: 'L1' },
  { id: 'm20', round: 4, homeTeamId: 't_chen', awayTeamId: 't_tongque', homeScore: 5, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/01/11', '11:00'), venue: VENUE, league: 'L1' },
  { id: 'm21', round: 5, homeTeamId: 't_crazydog', awayTeamId: 't_ppi', homeScore: 0, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2026/01/11', '13:00'), venue: VENUE, league: 'L2' },
  { id: 'm22', round: 5, homeTeamId: 't_pingtung', awayTeamId: 't_niaoshi', homeScore: 5, awayScore: 0, status: MatchStatus.FINISHED, timestamp: createDate('2026/01/11', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm23', round: 5, homeTeamId: 't_luzhu', awayTeamId: 't_canglong', homeScore: 0, awayScore: 7, status: MatchStatus.FINISHED, timestamp: createDate('2026/01/11', '15:00'), venue: VENUE, league: 'L2' },

// Round 6 - 2026/02/08 (Post Transfer Window)
  // ✅ 10:00 鳥仕 (0) vs PPI (1) [更正]
  { id: 'm24', round: 6, homeTeamId: 't_niaoshi', awayTeamId: 't_ppi', homeScore: 0, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/02/08', '10:00'), venue: VENUE, league: 'L2' },
  // ✅ 11:00 蒼龍 (2) vs 瘋Dog (3)
  { id: 'm25', round: 6, homeTeamId: 't_canglong', awayTeamId: 't_crazydog', homeScore: 2, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2026/02/08', '11:00'), venue: VENUE, league: 'L2' },
  // ✅ 13:00 屏東野猿 (3) vs 鹿逐 (1)
  { id: 'm26', round: 6, homeTeamId: 't_pingtung', awayTeamId: 't_luzhu', homeScore: 3, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/02/08', '13:00'), venue: VENUE, league: 'L2' },
  // ✅ 14:00 陳公舘 (6) vs 嘉義諸羅山 (1)
  { id: 'm27', round: 5, homeTeamId: 't_chen', awayTeamId: 't_chiayi', homeScore: 6, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/02/08', '14:00'), venue: VENUE, league: 'L1' },
  // ✅ 15:00 銅雀 (1) vs 酒號 (4)
  { id: 'm28', round: 5, homeTeamId: 't_tongque', awayTeamId: 't_jiuhao', homeScore: 1, awayScore: 4, status: MatchStatus.FINISHED, timestamp: createDate('2026/02/08', '15:00'), venue: VENUE, league: 'L1' },

// Round 7 - 2026/03/08
  { id: 'm29', round: 6, homeTeamId: 't_jiuhao', awayTeamId: 't_chen', homeScore: 5, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/08', '10:00'), venue: VENUE, league: 'L1' },
  { id: 'm30', round: 6, homeTeamId: 't_tongque', awayTeamId: 't_chiayi', homeScore: 1, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/08', '11:00'), venue: VENUE, league: 'L1' },
  { id: 'm31', round: 7, homeTeamId: 't_niaoshi', awayTeamId: 't_crazydog', homeScore: 3, awayScore: 4, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/08', '13:00'), venue: VENUE, league: 'L2' },
  { id: 'm32', round: 7, homeTeamId: 't_luzhu', awayTeamId: 't_ppi', homeScore: 1, awayScore: 6, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/08', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm33', round: 7, homeTeamId: 't_pingtung', awayTeamId: 't_canglong', homeScore: 1, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/08', '15:00'), venue: VENUE, league: 'L2' },

// Round 8 - 2026/03/22 (已完成)
  { id: 'm34', round: 8, homeTeamId: 't_luzhu', awayTeamId: 't_niaoshi', homeScore: 0, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/22', '10:00'), venue: VENUE, league: 'L2' },
  { id: 'm35', round: 8, homeTeamId: 't_ppi', awayTeamId: 't_canglong', homeScore: 0, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/22', '11:00'), venue: VENUE, league: 'L2' },
  { id: 'm36', round: 7, homeTeamId: 't_tongque', awayTeamId: 't_chen', homeScore: 2, awayScore: 3, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/22', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm37', round: 7, homeTeamId: 't_chiayi', awayTeamId: 't_jiuhao', homeScore: 2, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/22', '14:00'), venue: VENUE, league: 'L1' },
  { id: 'm38', round: 8, homeTeamId: 't_pingtung', awayTeamId: 't_crazydog', homeScore: 3, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/03/22', '15:00'), venue: VENUE, league: 'L2' },

  // Round 9 - 2026/04/12
  { id: 'm39', round: 9, homeTeamId: 't_luzhu', awayTeamId: 't_crazydog', homeScore: 1, awayScore: 6, status: MatchStatus.FINISHED, timestamp: createDate('2026/04/12', '10:00'), venue: VENUE, league: 'L2' },
  { id: 'm40', round: 8, homeTeamId: 't_jiuhao', awayTeamId: 't_tongque', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2026/04/12', '11:00'), venue: VENUE, league: 'L1' },
  { id: 'm41', round: 8, homeTeamId: 't_chiayi', awayTeamId: 't_chen', homeScore: 0, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/04/12', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm42', round: 9, homeTeamId: 't_ppi', awayTeamId: 't_pingtung', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, timestamp: createDate('2026/04/12', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm43', round: 9, homeTeamId: 't_canglong', awayTeamId: 't_niaoshi', homeScore: 1, awayScore: 1, status: MatchStatus.FINISHED, timestamp: createDate('2026/04/12', '15:00'), venue: VENUE, league: 'L2' },

  // Round 10 - 2026/04/26
  { id: 'm44', round: 10, homeTeamId: 't_ppi', awayTeamId: 't_crazydog', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, timestamp: createDate('2026/04/26', '10:00'), venue: VENUE, league: 'L2' },
  { id: 'm45', round: 10, homeTeamId: 't_canglong', awayTeamId: 't_luzhu', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, timestamp: createDate('2026/04/26', '11:00'), venue: VENUE, league: 'L2' },
  { id: 'm46', round: 9, homeTeamId: 't_chiayi', awayTeamId: 't_tongque', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, timestamp: createDate('2026/04/26', '13:00'), venue: VENUE, league: 'L1' },
  { id: 'm47', round: 10, homeTeamId: 't_niaoshi', awayTeamId: 't_pingtung', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, timestamp: createDate('2026/04/26', '14:00'), venue: VENUE, league: 'L2' },
  { id: 'm48', round: 9, homeTeamId: 't_chen', awayTeamId: 't_jiuhao', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, timestamp: createDate('2026/04/26', '15:00'), venue: VENUE, league: 'L1' }
];

// ==========================================
//   首頁影片資料 (MOCK_VIDEOS)
// ==========================================
export const MOCK_VIDEOS: Video[] = [
  { 
    id: 'v1', 
    title: '💥', 
    duration: 'Reels',
    thumbnail: '/d-league/assets/reels/reels_03.png', 
    date: '2026.02.15',
    link: 'https://www.instagram.com/d.league_tw/reel/DUxX_iIkyQK/'
  },
  { 
    id: 'v2', 
    title: '側掛金鈎🤩', 
    duration: 'Reels', 
    thumbnail: '/d-league/assets/reels/reels_02.png', 
    date: '2026.02.15',
    link: 'https://www.instagram.com/d.league_tw/reel/DUxBjJckyGj/'
  },
  { 
    id: 'v3', 
    title: '一氣呵成 💥',
    duration: 'Reels', 
    thumbnail: '/d-league/assets/reels/reels_01.png', 
    date: '2026.01.14',
    link: 'https://www.instagram.com/d.league_tw/reel/DTfEnAMk0nb/'
  },
];

// ✅ 新增：SECOND_YELLOW
export type EventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW';

// ✅ 修改：加入 isPK 與 isOwnGoal 來標記特殊進球
export interface MatchEvent {
    id: string;
    minute: number;
    player: string;
    type: EventType;
    team: 'HOME' | 'AWAY';
    isPK?: boolean;       
    isOwnGoal?: boolean;  
}

// ==========================================
//   比賽事件詳情 (MATCH_EVENTS)
// ==========================================
export const MATCH_EVENTS: Record<string, MatchEvent[]> = {
    // M1: 鹿逐 (1) vs 屏東野猿 (2)
    'm1': [
        { id: 'm1-1', minute: 25, player: '陳麒竣', type: 'GOAL', team: 'HOME' },
        { id: 'm1-2', minute: 25, player: '吳明遠', type: 'GOAL', team: 'AWAY' },
        { id: 'm1-3', minute: 32, player: '吳明遠', type: 'GOAL', team: 'AWAY' },
    ],
    // M2: 瘋Dog (5) vs 蒼龍FC (0)
    'm2': [
        { id: 'm2-1', minute: 3, player: '吳亦民', type: 'GOAL', team: 'HOME' },
        { id: 'm2-2', minute: 5, player: '潘晨維', type: 'YELLOW_CARD', team: 'AWAY' }, 
        { id: 'm2-4', minute: 5, player: '潘晨維', type: 'SECOND_YELLOW', team: 'AWAY' }, 
        { id: 'm2-5', minute: 23, player: '張博宇', type: 'GOAL', team: 'HOME' },
        { id: 'm2-6', minute: 24, player: '張博宇', type: 'GOAL', team: 'HOME' },
        { id: 'm2-7', minute: 26, player: '張博宇', type: 'GOAL', team: 'HOME' },
        { id: 'm2-8', minute: 28, player: '王亦瑋', type: 'GOAL', team: 'HOME' },
    ],
    // M3: 嘉義諸羅山FC (1) vs 酒號矯正署 (5)
    'm3': [
        { id: 'm3-1', minute: 2, player: '陳官澤', type: 'GOAL', team: 'HOME' },
        { id: 'm3-2', minute: 14, player: '顏廷邕', type: 'GOAL', team: 'AWAY' },
        { id: 'm3-3', minute: 15, player: '鄭詠翰', type: 'GOAL', team: 'AWAY' },
        { id: 'm3-4', minute: 31, player: '林鈺閔', type: 'GOAL', team: 'AWAY' },
        { id: 'm3-5', minute: 33, player: '謝孟軒', type: 'GOAL', team: 'AWAY' },
        { id: 'm3-6', minute: 38, player: '林冠亨', type: 'GOAL', team: 'AWAY' },
    ],
    // M4: 銅雀足球俱樂部 (0) vs 陳公舘 (2)
    // ✅ 修改：用 isPK: true 標記點球
    'm4': [
        { id: 'm4-1', minute: 18, player: '吳明威', type: 'GOAL', team: 'AWAY', isPK: true }, 
        { id: 'm4-2', minute: 34, player: '洪品丞', type: 'GOAL', team: 'AWAY', isPK: true }, 
    ],
    // M5: PPI TAINAN (0) vs 鳥仕足球俱樂部 (1)
    'm5': [
        { id: 'm5-1', minute: 25, player: '王竣弘', type: 'GOAL', team: 'AWAY' },
    ],
    // M6: 嘉義諸羅山FC (0) vs 陳公舘 (2)
    'm6': [
        { id: 'm6-1', minute: 4, player: '吳明威', type: 'GOAL', team: 'AWAY' },
        { id: 'm6-2', minute: 37, player: '洪品宇', type: 'GOAL', team: 'AWAY' },
    ],
    // M7: PPI TAINAN (6) vs 鹿逐俱樂部 (0)
    'm7': [
        { id: 'm7-1', minute: 9, player: '優沙', type: 'GOAL', team: 'HOME' },
        { id: 'm7-2', minute: 21, player: '高世科', type: 'GOAL', team: 'HOME' },
        { id: 'm7-3', minute: 30, player: '拉非', type: 'GOAL', team: 'HOME' },
        { id: 'm7-4', minute: 32, player: 'YEHUDA GAGAH WICAKSONO', type: 'GOAL', team: 'HOME' },
        { id: 'm7-5', minute: 37, player: '優沙', type: 'GOAL', team: 'HOME' },
        { id: 'm7-6', minute: 38, player: 'YEHUDA GAGAH WICAKSONO', type: 'GOAL', team: 'HOME' },
    ],
    // M8: 瘋Dog (4) vs 鳥仕足球俱樂部 (0)
    'm8': [
        { id: 'm8-1', minute: 4, player: '文俊偉', type: 'GOAL', team: 'HOME' },
        { id: 'm8-2', minute: 12, player: '王亦瑋', type: 'GOAL', team: 'HOME' },
        { id: 'm8-3', minute: 13, player: '戴威閎', type: 'GOAL', team: 'HOME' },
        { id: 'm8-4', minute: 33, player: '戴威閎', type: 'GOAL', team: 'HOME' },
    ],
    // M9: 蒼龍FC (4) vs 屏東野猿足球俱樂部 (3)
    // ✅ 修改：用 isOwnGoal: true 標記烏龍球
    'm9': [
        { id: 'm9-1', minute: 1, player: '簡法亦', type: 'GOAL', team: 'AWAY' },
        { id: 'm9-2', minute: 4, player: '毛邦澤', type: 'GOAL', team: 'HOME' },
        { id: 'm9-3', minute: 5, player: '楊承諺', type: 'GOAL', team: 'HOME' },
        { id: 'm9-4', minute: 7, player: '邱文良', type: 'GOAL', team: 'AWAY' },
        { id: 'm9-5', minute: 24, player: '林湧鈞', type: 'GOAL', team: 'AWAY', isOwnGoal: true },
        { id: 'm9-6', minute: 27, player: '毛邦澤', type: 'GOAL', team: 'HOME' },
        { id: 'm9-7', minute: 32, player: '李偲瑋', type: 'YELLOW_CARD', team: 'AWAY' },
        { id: 'm9-8', minute: 40, player: '王浩誠', type: 'GOAL', team: 'HOME' },
    ],
    // M10: 鳥仕足球俱樂部 (4) vs 鹿逐俱樂部 (0)
    'm10': [
        { id: 'm10-1', minute: 19, player: '蔡軒誠', type: 'GOAL', team: 'HOME' },
        { id: 'm10-2', minute: 28, player: '王竣弘', type: 'GOAL', team: 'HOME' },
        { id: 'm10-3', minute: 33, player: '林耀強', type: 'GOAL', team: 'HOME' },
        { id: 'm10-4', minute: 36, player: '王竣弘', type: 'GOAL', team: 'HOME' },
    ],
    // M11: 瘋Dog (2) vs 屏東野猿足球俱樂部 (2)
    // ✅ 修改：用 isPK: true 標記點球
    'm11': [
        { id: 'm11-1', minute: 6, player: '林韋堯', type: 'GOAL', team: 'AWAY' },
        { id: 'm11-2', minute: 13, player: '林韋堯', type: 'GOAL', team: 'AWAY' },
        { id: 'm11-3', minute: 24, player: '趙學邦', type: 'GOAL', team: 'HOME' },
        { id: 'm11-4', minute: 29, player: '趙學邦', type: 'GOAL', team: 'HOME', isPK: true }, 
        { id: 'm11-5', minute: 40, player: '李偲瑋', type: 'YELLOW_CARD', team: 'AWAY' },
    ],
    // M12: 酒號矯正署 (2) vs 銅雀足球俱樂部 (0)
    'm12': [
        { id: 'm12-1', minute: 34, player: '林冠亨', type: 'GOAL', team: 'HOME' },
        { id: 'm12-2', minute: 39, player: '鄭詠翰', type: 'GOAL', team: 'HOME' },
    ],
    // M13: 蒼龍FC (0) vs PPI TAINAN (1)
    'm13': [
        { id: 'm13-1', minute: 39, player: 'YEHUDA GAGAH WICAKSONO', type: 'GOAL', team: 'AWAY' },
    ],
    // M14: 屏東野猿 (0) vs PPI TAINAN (3)
    'm14': [
        { id: 'm14-1', minute: 23, player: '高世科', type: 'GOAL', team: 'AWAY' },
        { id: 'm14-2', minute: 35, player: '布丹', type: 'GOAL', team: 'AWAY' },
        { id: 'm14-3', minute: 39, player: '布丹', type: 'GOAL', team: 'AWAY' },
    ],
    // M15: 瘋Dog (6) vs 鹿逐俱樂部 (1)
    'm15': [
        { id: 'm15-1', minute: 3, player: '張博宇', type: 'GOAL', team: 'HOME' },
        { id: 'm15-2', minute: 8, player: '陳建宏', type: 'GOAL', team: 'HOME' },
        { id: 'm15-3', minute: 9, player: '王亦瑋', type: 'GOAL', team: 'HOME' },
        { id: 'm15-4', minute: 17, player: '戴威閎', type: 'GOAL', team: 'HOME' },
        { id: 'm15-5', minute: 22, player: '趙學邦', type: 'GOAL', team: 'HOME' },
        { id: 'm15-6', minute: 32, player: '張博宇', type: 'GOAL', team: 'HOME' },
        { id: 'm15-7', minute: 33, player: '陳麒竣', type: 'GOAL', team: 'AWAY' },
    ],
    // M16: 陳公舘 (1) vs 酒號矯正署 (3)
    'm16': [
        { id: 'm16-1', minute: 15, player: '鄭詠翰', type: 'GOAL', team: 'AWAY' },
        { id: 'm16-2', minute: 17, player: '施聖章', type: 'GOAL', team: 'AWAY' },
        { id: 'm16-3', minute: 18, player: '鄭詠翰', type: 'GOAL', team: 'AWAY' },
        { id: 'm16-4', minute: 37, player: '李家勳', type: 'GOAL', team: 'HOME' },
    ],
    // M17: 嘉義諸羅山FC (2) vs 銅雀足球俱樂部 (0)
    'm17': [
        { id: 'm17-1', minute: 4, player: '陳官澤', type: 'GOAL', team: 'HOME' },
        { id: 'm17-2', minute: 7, player: '黃偉倫', type: 'GOAL', team: 'HOME' },
        { id: 'm17-3', minute: 24, player: '林柏辰', type: 'YELLOW_CARD', team: 'HOME' },
    ],
    // M18: 鳥仕足球俱樂部 (0) vs 蒼龍FC (0)
    'm18': [
        { id: 'm18-1', minute: 37, player: '葉晉嘉', type: 'YELLOW_CARD', team: 'AWAY' },
    ],
    // M19: 酒號矯正署 (2) vs 嘉義諸羅山FC (2)
    'm19': [
        { id: 'm19-1', minute: 8, player: '林柏辰', type: 'GOAL', team: 'AWAY' },
        { id: 'm19-2', minute: 12, player: '鄭州偉', type: 'GOAL', team: 'AWAY' },
        { id: 'm19-3', minute: 15, player: '唐毓翔', type: 'YELLOW_CARD', team: 'AWAY' },
        { id: 'm19-4', minute: 25, player: '謝孟軒', type: 'GOAL', team: 'HOME' },
        { id: 'm19-5', minute: 28, player: '王建翔', type: 'YELLOW_CARD', team: 'AWAY' },
        { id: 'm19-6', minute: 33, player: '林冠亨', type: 'GOAL', team: 'HOME' },
    ],
    // M20: 陳公舘 (5) vs 銅雀足球俱樂部 (1)
    // ✅ 修改：加入 isPK 與 isOwnGoal
    'm20': [
        { id: 'm20-1', minute: 4, player: '林家銘', type: 'GOAL', team: 'HOME' },
        { id: 'm20-2', minute: 8, player: '巫嘉德', type: 'GOAL', team: 'HOME', isOwnGoal: true },
        { id: 'm20-3', minute: 27, player: '林宴丞', type: 'GOAL', team: 'AWAY' },
        { id: 'm20-4', minute: 29, player: '洪品宇', type: 'GOAL', team: 'HOME', isPK: true },
        { id: 'm20-5', minute: 36, player: '倪天銘', type: 'GOAL', team: 'HOME' },
        { id: 'm20-6', minute: 37, player: '洪品宇', type: 'GOAL', team: 'HOME' },
    ],
    // M21: 瘋Dog (0) vs PPI TAINAN (0)
    'm21': [],
    // M22: 屏東野猿 (5) vs 鳥仕足球俱樂部 (0)
    'm22': [
        { id: 'm22-1', minute: 10, player: '李偲瑋', type: 'GOAL', team: 'HOME' },
        { id: 'm22-2', minute: 27, player: '林韋堯', type: 'GOAL', team: 'HOME' },
        { id: 'm22-3', minute: 26, player: '謝俊杰', type: 'RED_CARD', team: 'AWAY' },
        { id: 'm22-4', minute: 31, player: '連哲緯', type: 'GOAL', team: 'HOME' },
        { id: 'm22-5', minute: 36, player: '李偲瑋', type: 'GOAL', team: 'HOME' },
        { id: 'm22-6', minute: 36, player: '邱文良', type: 'GOAL', team: 'HOME' },
    ],
    // M23: 鹿逐俱樂部 (0) vs 蒼龍FC (7)
    'm23': [
        { id: 'm23-1', minute: 15, player: '潘晨維', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-2', minute: 19, player: '林湧鈞', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-3', minute: 25, player: '潘晨維', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-4', minute: 27, player: '林聖恩', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-5', minute: 28, player: '潘晨維', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-6', minute: 29, player: '潘晨維', type: 'GOAL', team: 'AWAY' },
        { id: 'm23-7', minute: 32, player: '林湧鈞', type: 'GOAL', team: 'AWAY' },
    ],
    
    // ============================================
    // Round 6 (2026/02/08) 比賽紀錄
    // ============================================
    
'm24': [
        { id: 'm24-1', minute: 11, player: '布丹', type: 'GOAL', team: 'AWAY' },
    ],

    // M25: 蒼龍 (2) vs 瘋Dog (3)
    'm25': [
        { id: 'm25-1', minute: 7, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm25-2', minute: 12, player: '毛邦澤', type: 'GOAL', team: 'HOME' },
        { id: 'm25-3', minute: 18, player: '丁誌暉', type: 'GOAL', team: 'HOME' },
        { id: 'm25-4', minute: 32, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm25-5', minute: 39, player: '王佳祈', type: 'GOAL', team: 'AWAY' },
    ],

    // M26: 屏東野猿 (3) vs 鹿逐 (1)
    'm26': [
        { id: 'm26-1', minute: 18, player: '林韋堯', type: 'GOAL', team: 'HOME' },
        { id: 'm26-2', minute: 21, player: '吳明興', type: 'GOAL', team: 'HOME' },
        { id: 'm26-3', minute: 30, player: '陳麒竣', type: 'GOAL', team: 'AWAY' },
        { id: 'm26-4', minute: 33, player: '林韋堯', type: 'GOAL', team: 'HOME' },
    ],

    // M27: 陳公舘 (6) vs 嘉義諸羅山 (1)
    // ✅ 修改：加入 isPK 與 isOwnGoal
    'm27': [
        { id: 'm27-1', minute: 6, player: '吳明威', type: 'GOAL', team: 'HOME' },
        { id: 'm27-2', minute: 9, player: '洪品宇', type: 'GOAL', team: 'HOME', isPK: true },
        { id: 'm27-3', minute: 17, player: '楊俊雄', type: 'GOAL', team: 'HOME' },
        { id: 'm27-4', minute: 19, player: '曾龍盛', type: 'GOAL', team: 'HOME' },
        { id: 'm27-5', minute: 19, player: '楊俊雄', type: 'GOAL', team: 'HOME' },
        { id: 'm27-6', minute: 23, player: '鄭州偉', type: 'GOAL', team: 'HOME', isOwnGoal: true },
        { id: 'm27-7', minute: 40, player: '李鎮宇', type: 'GOAL', team: 'AWAY' },
    ],

    // M28: 銅雀 (1) vs 酒號 (4)
    'm28': [
        { id: 'm28-1', minute: 9, player: '林冠亨', type: 'GOAL', team: 'AWAY' },
        { id: 'm28-2', minute: 15, player: '何柏緯', type: 'GOAL', team: 'AWAY' },
        { id: 'm28-3', minute: 26, player: '趙南聰', type: 'GOAL', team: 'HOME' },
        { id: 'm28-4', minute: 28, player: '鄭詠翰', type: 'GOAL', team: 'AWAY' },
        { id: 'm28-5', minute: 30, player: '林晉威', type: 'YELLOW_CARD', team: 'HOME' },
        { id: 'm28-6', minute: 31, player: '林冠亨', type: 'GOAL', team: 'AWAY' },
    ],

// ============================================
    // Round 7 (2026/03/08) 比賽紀錄
    // ============================================
    
    // M29: 酒號矯正署 (5) vs 陳公舘 (2)
    'm29': [
        { id: 'm29-1', minute: 2, player: '林冠亨', type: 'GOAL', team: 'HOME' },
        { id: 'm29-2', minute: 7, player: '何柏緯', type: 'GOAL', team: 'HOME' },
        { id: 'm29-3', minute: 15, player: '楊俊雄', type: 'GOAL', team: 'AWAY' },
        { id: 'm29-4', minute: 18, player: '洪品宇', type: 'GOAL', team: 'AWAY' },
        { id: 'm29-5', minute: 19, player: '鄭詠翰', type: 'GOAL', team: 'HOME' },
        { id: 'm29-6', minute: 32, player: '鄭詠翰', type: 'GOAL', team: 'HOME' },
        { id: 'm29-7', minute: 39, player: '林冠亨', type: 'GOAL', team: 'HOME' },
    ],

    // M30: 銅雀足球俱樂部 (1) vs 嘉義諸羅山FC (2)
    'm30': [
        { id: 'm30-1', minute: 5, player: '趙南聰', type: 'GOAL', team: 'HOME' },
        { id: 'm30-2', minute: 36, player: '溫立丞', type: 'GOAL', team: 'AWAY' },
        { id: 'm30-3', minute: 38, player: '黃偉倫', type: 'GOAL', team: 'AWAY' },
    ],

    // M31: 鳥仕足球俱樂部 (3) vs 瘋Dog (4)
    'm31': [
        { id: 'm31-1', minute: 4, player: '陳宇翔', type: 'GOAL', team: 'HOME' },
        { id: 'm31-2', minute: 7, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm31-3', minute: 17, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm31-4', minute: 18, player: '高義莉', type: 'GOAL', team: 'HOME' },
        { id: 'm31-5', minute: 28, player: '王亦瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm31-6', minute: 30, player: '蘇智龍', type: 'GOAL', team: 'HOME' },
        { id: 'm31-7', minute: 39, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
    ],

    // M32: 鹿逐俱樂部 (1) vs PPI TAINAN (6)
    // ✅ 修改：加入 isOwnGoal
    'm32': [
        { id: 'm32-1', minute: 1, player: '林敬祐', type: 'GOAL', team: 'HOME' },
        { id: 'm32-2', minute: 12, player: '蘇凡迪', type: 'GOAL', team: 'AWAY' },
        { id: 'm32-3', minute: 22, player: '布丹', type: 'GOAL', team: 'AWAY' },
        { id: 'm32-4', minute: 24, player: '伊拉曼', type: 'GOAL', team: 'AWAY' },
        { id: 'm32-5', minute: 29, player: '陳泰盛', type: 'GOAL', team: 'AWAY', isOwnGoal: true },
        { id: 'm32-6', minute: 32, player: 'YEHUDA GAGAH WICAKSONO', type: 'GOAL', team: 'AWAY' },
        { id: 'm32-7', minute: 39, player: '布丹', type: 'GOAL', team: 'AWAY' },
    ],

    // M33: 屏東野猿足球俱樂部 (1) vs 蒼龍FC (1)
    'm33': [
        { id: 'm33-1', minute: 29, player: '林韋堯', type: 'GOAL', team: 'HOME' },
        { id: 'm33-2', minute: 36, player: '葉晉嘉', type: 'GOAL', team: 'AWAY' },
    ],

    // M34: 鹿逐 (0) vs 鳥仕 (3)
    'm34': [
        { id: 'm34-1', minute: 19, player: '吳昱陞', type: 'GOAL', team: 'AWAY' },
        { id: 'm34-2', minute: 28, player: '林耀強', type: 'GOAL', team: 'AWAY' },
        { id: 'm34-3', minute: 32, player: '陳遠泰', type: 'GOAL', team: 'AWAY' },
    ],
    // M35: PPI (0) vs 蒼龍 (1)
    'm35': [
        { id: 'm35-1', minute: 15, player: '盧冠宇', type: 'GOAL', team: 'AWAY' },
    ],
    // M36: 銅雀 (2) vs 陳公舘 (3)
    // ✅ 修改：加入 isPK
    'm36': [
        { id: 'm36-1', minute: 5, player: '林晉威', type: 'GOAL', team: 'HOME' },
        { id: 'm36-2', minute: 23, player: '潘志豪', type: 'GOAL', team: 'AWAY' },
        { id: 'm36-3', minute: 24, player: '克魯茲', type: 'YELLOW_CARD', team: 'HOME' },
        { id: 'm36-4', minute: 32, player: '洪品宇', type: 'GOAL', team: 'AWAY', isPK: true },
        { id: 'm36-5', minute: 34, player: '吳明威', type: 'GOAL', team: 'AWAY' },
        { id: 'm36-6', minute: 35, player: '趙南聰', type: 'GOAL', team: 'HOME' },
    ],
    // M37: 嘉義 (2) vs 酒號 (1)
    'm37': [
        { id: 'm37-1', minute: 22, player: '鄭州偉', type: 'GOAL', team: 'HOME' },
        { id: 'm37-2', minute: 25, player: '鄭州偉', type: 'GOAL', team: 'HOME' },
        { id: 'm37-3', minute: 38, player: '何柏緯', type: 'GOAL', team: 'AWAY' },
    ],
    // M38: 屏東 (3) vs 瘋Dog (1)
    'm38': [
        { id: 'm38-1', minute: 5, player: '連哲緯', type: 'GOAL', team: 'HOME' },
        { id: 'm38-2', minute: 19, player: '王亦瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm38-3', minute: 31, player: '連哲緯', type: 'GOAL', team: 'HOME' },
        { id: 'm38-4', minute: 33, player: '黃浩程', type: 'GOAL', team: 'HOME' },
    ],

    // ============================================
    // Round 9 (2026/04/12) 比賽紀錄
    // ============================================
    
    // M39: 鹿逐 (1) vs 瘋Dog (6)
    'm39': [
        { id: 'm39-1', minute: 2, player: '吳亦民', type: 'GOAL', team: 'AWAY' },
        { id: 'm39-2', minute: 12, player: '張博宇', type: 'GOAL', team: 'AWAY' },
        { id: 'm39-3', minute: 13, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm39-4', minute: 17, player: '陳泰盛', type: 'GOAL', team: 'HOME' },
        { id: 'm39-5', minute: 24, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm39-6', minute: 35, player: '劉力瑋', type: 'GOAL', team: 'AWAY' },
        { id: 'm39-7', minute: 36, player: '吳亦民', type: 'GOAL', team: 'AWAY' },
    ],
    // M40: 酒號 (2) vs 銅雀 (2)
    'm40': [
        { id: 'm40-1', minute: 24, player: '鄭詠翰', type: 'GOAL', team: 'HOME' },
        { id: 'm40-2', minute: 29, player: '林鈺閔', type: 'GOAL', team: 'HOME' },
        { id: 'm40-3', minute: 35, player: '趙南聰', type: 'GOAL', team: 'AWAY' },
        { id: 'm40-4', minute: 39, player: '趙學克', type: 'GOAL', team: 'AWAY' },
    ],
    // M41: 嘉義 (0) vs 陳公舘 (1)
    'm41': [
        { id: 'm41-1', minute: 26, player: '倪天銘', type: 'GOAL', team: 'AWAY' },
    ],
    // M42: PPI (2) vs 屏東 (2)
    'm42': [
        { id: 'm42-1', minute: 4, player: '林韋堯', type: 'GOAL', team: 'AWAY' },
        { id: 'm42-2', minute: 19, player: 'YEHUDA GAGAH WICAKSONO', type: 'GOAL', team: 'HOME' },
        { id: 'm42-3', minute: 28, player: '林韋堯', type: 'GOAL', team: 'AWAY' },
        { id: 'm42-4', minute: 31, player: '布丹', type: 'GOAL', team: 'HOME' },
        { id: 'm42-5', minute: 33, player: '牙提', type: 'YELLOW_CARD', team: 'HOME' },
    ],
    // M43: 蒼龍 (1) vs 鳥仕 (1)
    'm43': [
        { id: 'm43-1', minute: 12, player: '蘇智龍', type: 'GOAL', team: 'AWAY' },
        { id: 'm43-2', minute: 37, player: '潘晨維', type: 'GOAL', team: 'HOME' },
    ],
};