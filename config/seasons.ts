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
    status: 'review',
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
    registrationMessage: 'D LEAGUE 2026/27 錄取名單已公布',
    registrationContent: {
      intro: 'D LEAGUE 2026/27 賽季正式錄取及備取名單已公布，錄取球隊請依個別通知於指定期限內完成繳費及參賽確認',
      ageReferenceDate: '2026-11-01',
      minimumAge: 15,
      minimumPlayers: 12,
      maximumPlayers: 20,
      maximumStaff: 3,
      staffDescription: '可包含領隊、教練及管理等職務，其中領隊為必登職務',
      steps: [
        '完成正式報名',
        '主辦單位審核球隊資料與實力',
        '公布錄取及備取名單',
        '錄取球隊完成繳費與參賽確認',
        '提交球員及隊職員登錄資料',
        '公布正式分組與賽程',
      ],
      faqItems: [
        {
          question: '列入正式錄取名單就完成參賽確認了嗎？',
          answer: '尚未。錄取球隊仍須依個別通知於指定期限內完成報名費、保證金及相關程序，完成後才視為確認參賽',
        },
        {
          question: 'L1、L2、L3 正式分組何時公布？',
          answer: '正式分組將於錄取球隊完成繳費及參賽確認、備取遞補程序結束後，由主辦單位統一公告',
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
          question: '備取球隊如何遞補？',
          answer: '如有錄取球隊未於期限內完成參賽確認或退出，主辦單位將依整體分組及賽事安排通知備取球隊辦理遞補',
        },
        {
          question: '報名費及後續期限在哪裡查看？',
          answer: '相關費用、繳交期限、球員登錄期限及其他錄取後程序，將於正式錄取通知中個別說明',
        },
      ],
      reviewDescription: '錄取球隊須依通知期限完成繳費、保證金及參賽確認；正式分組將於確認最終參賽隊伍後另行公告',
      reviewFeatures: [
        '依錄取通知完成繳費與保證金',
        '完成球員及隊職員登錄程序',
        'L1、L2、L3 正式分組另行公告',
        '未於期限內完成者得由備取球隊遞補',
      ],
    },
    registrationResults: {
      announcedAt: '2026-07-21',
      acceptedTeams: [
        'Wanderers',
        '屏東野狼足球俱樂部',
        '阿蓮FC',
        '台南鳥仕足球俱樂部',
        '嘉義諸羅山FC',
        '黑狼FC',
        '石門聯隊',
        '高雄香港人足球俱樂部',
        '南州陳公舘',
        'SF足球俱樂部',
        '台南長青足球俱樂部',
        'Kuromi',
        '聖騎士足球俱樂部',
        '鹿逐俱樂部',
        'SOUTHBOYS FC',
        '高雄業餘足球俱樂部',
        '銅雀俱樂部',
        '屏東野猿足球俱樂部',
      ],
      waitlistedTeams: ['高雄黑騎士足球隊'],
      note: '名單排序不代表錄取順位、級別或最終分組。錄取球隊須於指定期限內完成報名費、保證金及相關程序後，方視為完成參賽確認。',
      groupingNote: 'L1、L2、L3 正式分組將於錄取球隊完成繳費及參賽確認後另行公告。',
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
