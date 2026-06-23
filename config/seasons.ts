import type { LeagueConfig, LeagueId, SeasonConfig, SeasonId } from '../types/season';

const createUnavailableLeagueMap = (): Record<LeagueId, LeagueConfig | null> => ({
  L1: null,
  L2: null,
  L3: null,
});

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
    venue: '台南市立仁德文賢國中人工草皮足球場',
    heroFallbackImage: 'banner.png',
    enabledLeagues: ['L1', 'L2'],
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
    venue: '台南市立仁德文賢國中人工草皮足球場',
    registrationFormUrl: 'https://forms.gle/juLDiY73TdJGvWCj9',
    regulationsUrl: 'https://drive.google.com/file/d/1MIe3p4ielXLnJSnr_V8YNCFpvonlxxS4/view?usp=drive_link',
    heroImageDesktop: 'assets/seasons/2026-27/registration-poster-desktop.jpg',
    heroImageMobile: 'assets/seasons/2026-27/registration-poster-mobile.jpg',
    heroFallbackImage: 'banner.png',
    enabledLeagues: ['L1', 'L2', 'L3'],
    registrationMessage: 'D LEAGUE 2026/27 正式開放報名',
    leagues: season2026Leagues,
  },
};

export const DEFAULT_SEASON_ID: SeasonId = '2026-27';

export const isSeasonId = (value: string | null): value is SeasonId =>
  value === '2025-26' || value === '2026-27';

export const getSeasonConfig = (seasonId: SeasonId): SeasonConfig => SEASONS[seasonId];
