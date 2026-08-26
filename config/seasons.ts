import season2026Participants from '../data/seasons/2026-27/participants.json';
import type {
  CompetitionRules,
  LeagueConfig,
  LeagueId,
  SeasonConfig,
  SeasonId,
  SeasonParticipantsConfig,
} from '../types/season';
import { CURRENT_SEASON_ID, isSeasonId } from './siteManifest.js';
import { MATCH_VENUE_NAME } from './siteConfig';

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
    status: 'upcoming',
    isDefault: true,
    registrationStart: '2026-06-23',
    registrationEnd: '2026-07-20',
    venue: MATCH_VENUE_NAME,
    regulationsUrl: 'https://drive.google.com/file/d/1MIe3p4ielXLnJSnr_V8YNCFpvonlxxS4/view?usp=drive_link',
    heroImageDesktop: 'assets/seasons/2026-27/registration-poster-desktop.png',
    heroImageMobile: 'assets/seasons/2026-27/registration-poster-mobile.png',
    heroFallbackImage: 'banner.png',
    enabledLeagues: ['L1', 'L2', 'L3'],
    registrationMessage: 'D LEAGUE 2026/27 正式參賽隊伍及分級已公布',
    registrationContent: {
      intro: 'D LEAGUE 2026/27 賽季共 18 支球隊完成參賽確認，L1、L2、L3 各 6 隊，正式分級名單如下',
      ageReferenceDate: '2026-11-01',
      minimumAge: 15,
      ageSummary: '2026/11/01 基準；一般年滿 15 歲，L3 14-15 歲須審核',
      minimumPlayers: 12,
      maximumPlayers: 20,
      maximumStaff: 3,
      staffDescription: '可包含領隊、教練及管理等職務，其中領隊為必登職務',
      steps: [
        '完成正式報名',
        '完成球隊審核與初步錄取',
        '完成參賽確認及備取遞補',
        '公布 L1、L2、L3 正式分級',
        '提交球員及隊職員登錄資料',
        '公布完整賽程及賽事資訊',
      ],
      faqItems: [
        {
          question: '正式參賽隊伍及分級是否已確定？',
          answer: '是。2026/27 賽季共 18 支球隊完成參賽確認，L1、L2、L3 各 6 隊，正式分級已公布',
        },
        {
          question: '球員年齡及登錄人數有什麼限制？',
          answer: '球員年齡以 2026/11/01 當日為計算基準，性別不限。年滿 15 歲者可登錄 L1、L2 或 L3，無年齡上限；年滿 14 歲但未滿 15 歲者，須繳交教練推薦書並經主辦單位審核同意後，方可登錄 L3；未滿 14 歲者不得登錄。未滿 18 歲者須繳交家長同意書。每隊球員登錄人數為 12-20 人',
        },
        {
          question: '隊職員可以登錄多少人？',
          answer: '每隊最多登錄 3 名隊職員，可包含領隊、教練及管理等職務，其中領隊為必登職務',
        },
        {
          question: '每隊可以踢幾場比賽？',
          answer: 'L1、L2、L3 均採雙循環，每隊共進行 10 場正式比賽',
        },
        {
          question: '球員及隊職員登錄何時截止？',
          answer: '球員及隊職員登錄截止為 2026/08/31 23:59；資料格式及提交方式請依主辦單位通知辦理',
        },
        {
          question: '完整賽程何時公布？',
          answer: '主辦單位將於球員登錄及賽程編排作業完成後統一公布，請留意官網及官方社群最新消息',
        },
      ],
      reviewDescription: '18 支球隊已完成參賽確認，後續進入球員及隊職員登錄、資料審核與賽程編排階段',
      reviewFeatures: [
        'L1、L2、L3 各 6 支球隊',
        '正式參賽分級已公布',
        '球員及隊職員登錄至 8 月 31 日',
        '完整賽程及領隊會議資訊另行公告',
      ],
    },
    seasonParticipants: season2026Participants as SeasonParticipantsConfig,
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
