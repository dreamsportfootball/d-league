import { CURRENT_SEASON_ID, isSeasonId } from './siteManifest.js';
import { MATCH_VENUE_NAME } from './siteConfig';
import type { CompetitionRules, LeagueConfig, LeagueId, SeasonConfig, SeasonId } from '../types/season';

const createUnavailableLeagueMap = (): Record<LeagueId, LeagueConfig | null> => ({
  L1: null,
  L2: null,
  L3: null,
});

const legacyRules: CompetitionRules = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  rankingCriteria: ['GOAL_DIFFERENCE', 'GOALS_FOR'],
  yellowCardSuspensionThreshold: 2,
  automaticSuspensionMatches: 1,
  yellowCardFine: 500,
  secondYellowFine: 1000,
  directRedFine: 1000,
  resetCrossMatchYellowsAfterAnySuspension: true,
};

const season2026Rules: CompetitionRules = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  rankingCriteria: [
    'GOAL_DIFFERENCE',
    'GOALS_FOR',
    'HEAD_TO_HEAD_POINTS',
    'HEAD_TO_HEAD_GOAL_DIFFERENCE',
    'HEAD_TO_HEAD_GOALS_FOR',
    'FEWEST_DIRECT_RED',
    'FEWEST_SECOND_YELLOW',
    'FEWEST_YELLOW',
  ],
  yellowCardSuspensionThreshold: 2,
  automaticSuspensionMatches: 1,
  yellowCardFine: 500,
  secondYellowFine: 1000,
  directRedFine: 1000,
  resetCrossMatchYellowsAfterAnySuspension: true,
};

const season2025Leagues = createUnavailableLeagueMap();
season2025Leagues.L1 = {
  id: 'L1',
  displayName: 'LEAGUE 1',
  shortName: 'L1',
  expectedTeamCount: 4,
  format: 'triple-round-robin',
  rounds: 3,
  matchesPerTeam: 9,
  promotionPlaces: 0,
  relegationPlaces: 0,
  hasPlayoff: false,
  description: 'L1 採三循環賽制，每隊共比賽 9 場',
};
season2025Leagues.L2 = {
  id: 'L2',
  displayName: 'LEAGUE 2',
  shortName: 'L2',
  expectedTeamCount: 6,
  format: 'double-round-robin',
  rounds: 2,
  matchesPerTeam: 10,
  promotionPlaces: 0,
  relegationPlaces: 0,
  hasPlayoff: false,
  description: 'L2 採雙循環賽制，每隊共比賽 10 場',
};

const season2026Leagues = createUnavailableLeagueMap();
season2026Leagues.L1 = {
  id: 'L1',
  displayName: 'LEAGUE 1',
  shortName: 'L1',
  expectedTeamCount: 6,
  format: 'double-round-robin',
  rounds: 2,
  matchesPerTeam: 10,
  promotionPlaces: 0,
  relegationPlaces: 1,
  hasPlayoff: false,
  description: 'L1 採雙循環賽制，每隊共比賽 10 場，第 6 名降至 L2',
};
season2026Leagues.L2 = {
  id: 'L2',
  displayName: 'LEAGUE 2',
  shortName: 'L2',
  expectedTeamCount: 6,
  format: 'double-round-robin',
  rounds: 2,
  matchesPerTeam: 10,
  promotionPlaces: 1,
  relegationPlaces: 1,
  hasPlayoff: false,
  description: 'L2 採雙循環賽制，每隊共比賽 10 場，第 1 名升至 L1，第 6 名降至 L3',
};
season2026Leagues.L3 = {
  id: 'L3',
  displayName: 'LEAGUE 3',
  shortName: 'L3',
  expectedTeamCount: 6,
  format: 'double-round-robin',
  rounds: 2,
  matchesPerTeam: 10,
  promotionPlaces: 1,
  relegationPlaces: 0,
  hasPlayoff: false,
  description: 'L3 採雙循環賽制，每隊共比賽 10 場，第 1 名升至 L2',
};

export const SEASONS: Record<SeasonId, SeasonConfig> = {
  '2025-26': {
    id: '2025-26',
    displayName: 'D LEAGUE 2025/26',
    shortName: '2025/26',
    status: 'completed',
    isDefault: false,
    venue: MATCH_VENUE_NAME,
    heroFallbackImage: 'banner.png',
    youtubePlaylistEmbedUrl: 'https://www.youtube.com/embed/videoseries?list=PLly5Ox2OW8PCiK_sny6DzH9EdA73qK7Hw',
    youtubePlaylistLabel: '2025/26 賽季完整賽事',
    enabledLeagues: ['L1', 'L2'],
    rules: legacyRules,
    standingsDisplay: {
      showPointsSummary: false,
      rankingRules: ['得失球差', '進球數', '並列'],
    },
    leagues: season2025Leagues,
  },
  '2026-27': {
    id: '2026-27',
    displayName: 'D LEAGUE 2026/27',
    shortName: '2026/27',
    status: 'registration',
    isDefault: true,
    registrationStart: '2026-06-23',
    registrationEnd: '2026-07-20',
    venue: MATCH_VENUE_NAME,
    registrationFormUrl: 'https://forms.gle/juLDiY73TdJGvWCj9',
    regulationsUrl: 'https://drive.google.com/file/d/1MIe3p4ielXLnJSnr_V8YNCFpvonlxxS4/view?usp=drive_link',
    heroImageDesktop: 'assets/seasons/2026-27/registration-poster-desktop.png',
    heroImageMobile: 'assets/seasons/2026-27/registration-poster-mobile.png',
    heroFallbackImage: 'banner.png',
    enabledLeagues: ['L1', 'L2', 'L3'],
    registrationMessage: 'D LEAGUE 2026/27 正式開放報名',
    registrationContent: {
      intro: '不論是具競爭力的成熟球隊，或剛成立並希望累積正式比賽經驗的新球隊，都可以依照目前實力選擇希望參加的級別',
      ageReferenceDate: '2026-11-01',
      minimumAge: 15,
      minimumPlayers: 12,
      maximumPlayers: 20,
      maximumStaff: 3,
      staffDescription: '可包含領隊、教練及管理等職務，其中領隊為必登職務',
      steps: [
        '填寫正式報名表',
        '主辦單位審核球隊資料與實力',
        '公布錄取球隊及正式參賽級別',
        '依錄取通知完成相關程序',
        '提交球員及隊職員登錄資料',
        '公布正式賽程',
      ],
      faqItems: [
        {
          question: '填寫報名表後就一定會錄取嗎？',
          answer: '不一定。主辦單位會依球隊過往成績、主要球員組成、參賽經驗、紀律及各級別整體實力進行審核，最終錄取名單以主辦單位公告為準',
        },
        {
          question: '可以自行選擇 L1、L2 或 L3 嗎？',
          answer: '報名時可以填寫希望參加的級別，但主辦單位會依整體實力進行分級，最終參賽級別以公布結果為準',
        },
        {
          question: '球員年齡及登錄人數有什麼限制？',
          answer: '球員須於 2026/11/01 當日年滿 15 歲，性別不限。每隊球員最少登錄 12 人、最多 20 人',
        },
        {
          question: '隊職員可以登錄多少人？',
          answer: '每隊最多登錄 3 名隊職員，可包含領隊、教練及管理等職務，其中領隊為必登職務',
        },
        {
          question: '每隊可以踢幾場比賽？',
          answer: '目前規劃 L1、L2、L3 均採雙循環，每隊共進行 10 場正式比賽',
        },
        {
          question: '經費較有限的 L3 球隊有其他方案嗎？',
          answer: 'L3 預計提供一隊工作人員合作名額，協助 L1、L2 比賽日的場地整理、設備設置及比賽期間撿球等工作，實際內容與資格由主辦單位另行確認',
        },
        {
          question: '報名費及後續期限在哪裡查看？',
          answer: '相關費用、繳交期限、球員登錄期限及其他錄取後程序，將於正式錄取通知中個別說明',
        },
      ],
      reviewDescription: '主辦單位將依球隊過往成績、主要球員組成、參賽經驗、紀律及各級別整體實力進行審核與分級，最終參賽級別以主辦單位公布結果為準',
      reviewFeatures: [
        '可依球隊目前實力選擇希望參加的級別',
        '各級別預計錄取 6 支球隊',
        '正式實施升降級制度',
        '不設升降級附加賽',
      ],
    },
    rules: season2026Rules,
    standingsDisplay: {
      showPointsSummary: true,
      rankingRules: [
        '總得失球差',
        '總進球數',
        '相關球隊間對戰積分',
        '相關球隊間對戰得失球差',
        '相關球隊間對戰進球數',
        '直接紅牌較少',
        '雙黃退場較少',
        '黃牌較少',
      ],
      footerNote: '全部相同且影響冠軍、升降級或遞補順位時，以公開抽籤決定；其他情況得並列',
    },
    leagues: season2026Leagues,
  },
};

export const DEFAULT_SEASON_ID: SeasonId = CURRENT_SEASON_ID;
export { isSeasonId };

export const getSeasonConfig = (seasonId: SeasonId): SeasonConfig => SEASONS[seasonId];
