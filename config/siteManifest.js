// @ts-check

/** @type {readonly ['2025-26', '2026-27']} */
export const SEASON_IDS = ['2025-26', '2026-27'];

/** @typedef {(typeof SEASON_IDS)[number]} SeasonId */

/** @type {SeasonId} */
export const CURRENT_SEASON_ID = '2026-27';

export const SITE_NAME = 'D LEAGUE｜台南夢達七人足球聯賽';
export const SITE_URL = 'https://dreamsportfootball.github.io/d-league';
export const DEFAULT_DESCRIPTION =
  'D LEAGUE 台南夢達七人足球聯賽，提供賽季報名、賽程結果、積分榜、球隊資料、球員數據與賽事消息';
export const DEFAULT_SOCIAL_IMAGE = `assets/seasons/${CURRENT_SEASON_ID}/registration-poster-desktop.png`;
export const SITE_SOCIAL_URLS = [
  'https://www.instagram.com/d.league_tw/',
  'https://www.youtube.com/@DreamSportFootball',
  'https://www.facebook.com/profile.php?id=61576222172219',
];

/** @param {SeasonId} seasonId */
export const getSeasonShortName = (seasonId) => seasonId.replace('-', '/');

/** @param {SeasonId} seasonId */
export const getSeasonDisplayName = (seasonId) => `D LEAGUE ${getSeasonShortName(seasonId)}`;

/**
 * @param {string | null | undefined} value
 * @returns {value is SeasonId}
 */
export const isSeasonId = (value) =>
  typeof value === 'string' && SEASON_IDS.some((seasonId) => seasonId === value);

const currentSeasonDisplayName = getSeasonDisplayName(CURRENT_SEASON_ID);

export const PAGE_SEO = {
  '/': {
    label: currentSeasonDisplayName,
    description: DEFAULT_DESCRIPTION,
  },
  '/registration': {
    label: '賽季報名',
    description: `${currentSeasonDisplayName} 報名資格、賽制、流程及常見問題`,
  },
  '/schedule': {
    label: '賽程與結果',
    description: `${currentSeasonDisplayName} 完整賽程、比賽結果及事件詳情`,
  },
  '/standings': {
    label: '積分榜',
    description: `${currentSeasonDisplayName} L1、L2、L3 最新積分及排名`,
  },
  '/stats': {
    label: '數據中心',
    description: `${currentSeasonDisplayName} 射手榜、紅黃牌、停賽與紀律資料`,
  },
  '/news': {
    label: '最新消息',
    description: 'D LEAGUE 官方公告、賽事戰報與過往賽季消息',
  },
  '/media': {
    label: '賽事媒體',
    description: 'D LEAGUE 比賽影片、相簿及賽事媒體內容',
  },
  '/about': {
    label: '關於我們',
    description: '認識 D LEAGUE 台南夢達七人足球聯賽',
  },
  '/cup': {
    label: '2026 新春賀歲盃',
    description: '2026 台南夢達新春賀歲盃完整賽果、參賽球隊及賽事影像',
  },
};
