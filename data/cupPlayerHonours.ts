import { CUP_EVENT } from '../cupData';

export type CupPlayerHonourKind =
  | 'CUP_CHAMPION'
  | 'CUP_RUNNER_UP'
  | 'PLATE_CHAMPION'
  | 'PLATE_RUNNER_UP';

export type CupPlayerHonourTitle =
  | '盃賽冠軍'
  | '盃賽亞軍'
  | '盤賽冠軍'
  | '盤賽亞軍';

export interface CupPlayerHonourAward {
  id: string;
  eventDate: string;
  period: string;
  competitionName: string;
  kind: CupPlayerHonourKind;
  title: CupPlayerHonourTitle;
  teamId: string;
  teamName: string;
  participantNames: readonly string[];
}

const award = (
  id: string,
  kind: CupPlayerHonourKind,
  title: CupPlayerHonourTitle,
  teamId: string,
  teamName: string,
  participantNames: readonly string[],
): CupPlayerHonourAward => ({
  id,
  eventDate: CUP_EVENT.date,
  period: String(new Date(CUP_EVENT.date).getFullYear()),
  competitionName: CUP_EVENT.shortName,
  kind,
  title,
  teamId,
  teamName,
  participantNames,
});

export const CUP_PLAYER_HONOUR_AWARDS: readonly CupPlayerHonourAward[] = [
  award(
    '2026-cup-champion-dong-gang',
    'CUP_CHAMPION',
    '盃賽冠軍',
    'DONG_GANG',
    '東港足球隊',
    [
      '洪品宇',
      '林志翰',
      '李秉錦',
      '劉立賢',
      '洪品丞',
      '王琨崴',
      '王柏荃',
      '劉如明',
      '賴義橋',
      '林宥憲',
      '何嘉振',
    ],
  ),
  award(
    '2026-cup-runner-up-happy-new-year',
    'CUP_RUNNER_UP',
    '盃賽亞軍',
    'HAPPY_NEW_YEAR',
    '新年快快樂樂',
    [
      '林冠亨',
      '李家勳',
      '吳啟明',
      '蘇嘉雄',
      '何柏緯',
      '劉和翰',
      '蔡政儒',
      '李冠霈',
      '陳威仁',
      '陳家駿',
      '王佳祈',
      '郭博瑋',
      '施聖章',
      '陳柏諭',
    ],
  ),
  award(
    '2026-plate-champion-tainan-evergreen',
    'PLATE_CHAMPION',
    '盤賽冠軍',
    'TN_SENIOR',
    '台南長青俱樂部',
    [
      '吳進偉',
      '李進豐',
      '毛鎮峰',
      '蕭貽陽',
      '黃翔',
      '劉宗緯',
      '劉允閎',
      '陳柏宇',
      '曹冠祥',
      '譚敬耀',
      '徐鈺凱',
      '謝易政',
      '周學廣',
    ],
  ),
  award(
    '2026-plate-runner-up-worker',
    'PLATE_RUNNER_UP',
    '盤賽亞軍',
    'WORKER',
    '歹命打工人',
    [
      '蔡承熹',
      '王彥棋',
      '邊鈺淳',
      '潘佳謙',
      '曾子豪',
      '曾清鈺',
      '江敬廷',
      '龔振中',
      '廖子維',
      '鄧鼎瀚',
    ],
  ),
];
