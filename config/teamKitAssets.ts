import type { SeasonId } from '../types/season';

export interface TeamKitAssetPair {
  home?: string;
  away?: string;
}

const TEAM_KIT_ASSETS: Partial<Record<SeasonId, Record<string, TeamKitAssetPair>>> = {
  '2026-27': {
    t_tainan_evergreen_2026: {
      home: 'assets/seasons/2026-27/kits/tainan-evergreen-home.png',
      away: 'assets/seasons/2026-27/kits/tainan-evergreen-away.png',
    },
    t_black_wolf_2026: {
      home: 'assets/seasons/2026-27/kits/black-wolf-fc-home.png',
      away: 'assets/seasons/2026-27/kits/black-wolf-fc-away.png',
    },
    t_alian_2026: {
      home: 'assets/seasons/2026-27/kits/alian-fc-home.png',
      away: 'assets/seasons/2026-27/kits/alian-fc-away.png',
    },
    t_kaohsiung_hk_2026: {
      home: 'assets/seasons/2026-27/kits/kaohsiung-hongkongers-fc-home.png',
      away: 'assets/seasons/2026-27/kits/kaohsiung-hongkongers-fc-away.png',
    },
    t_luzhu_2026: {
      home: 'assets/seasons/2026-27/kits/luzhu-club-home.png',
      away: 'assets/seasons/2026-27/kits/luzhu-club-away.png',
    },
    t_chen_2026: {
      home: 'assets/seasons/2026-27/kits/nanzhou-chen-home.png',
      away: 'assets/seasons/2026-27/kits/nanzhou-chen-away.png',
    },
    t_pingtung_wolves_2026: {
      home: 'assets/seasons/2026-27/kits/pingtung-wolves-fc-home.png',
      away: 'assets/seasons/2026-27/kits/pingtung-wolves-fc-away.png',
    },
    t_niaoshi_2026: {
      home: 'assets/seasons/2026-27/kits/tainan-niaoshi-home.png',
      away: 'assets/seasons/2026-27/kits/tainan-niaoshi-away.png',
    },
    t_chiayi_235_2026: {
      home: 'assets/seasons/2026-27/kits/chiayi-235-fc-home.png',
      away: 'assets/seasons/2026-27/kits/chiayi-235-fc-away.png',
    },
    t_kaohsiung_amateur_2026: {
      home: 'assets/seasons/2026-27/kits/kaohsiung-amateur-fc-home.png',
      away: 'assets/seasons/2026-27/kits/kaohsiung-amateur-fc-away.png',
    },
    t_pingtung_wild_ape_2026: {
      home: 'assets/seasons/2026-27/kits/pingtung-wild-ape-fc-home.png',
      away: 'assets/seasons/2026-27/kits/pingtung-wild-ape-fc-away.png',
    },
    t_kaohsiung_black_knights_2026: {
      home: 'assets/seasons/2026-27/kits/kaohsiung-black-knights-home.png',
      away: 'assets/seasons/2026-27/kits/kaohsiung-black-knights-away.png',
    },
    t_kuromi_2026: {
      home: 'assets/seasons/2026-27/kits/kuromi-home.png',
      away: 'assets/seasons/2026-27/kits/kuromi-away.png',
    },
    t_tongque_2026: {
      home: 'assets/seasons/2026-27/kits/tongque-club-home.png',
      away: 'assets/seasons/2026-27/kits/tongque-club-away.png',
    },
    t_southboys_2026: {
      home: 'assets/seasons/2026-27/kits/southboys-fc-home.png',
      away: 'assets/seasons/2026-27/kits/southboys-fc-away.png',
    },
    t_sf_2026: {
      home: 'assets/seasons/2026-27/kits/sf-football-club-home.png',
      away: 'assets/seasons/2026-27/kits/sf-football-club-away.png',
    },
    t_wanderers_2026: {
      home: 'assets/seasons/2026-27/kits/wanderers-home.png',
      away: 'assets/seasons/2026-27/kits/wanderers-away.png',
    },
    t_holy_knights_2026: {
      home: 'assets/seasons/2026-27/kits/holy-knights-fc-home.png',
      away: 'assets/seasons/2026-27/kits/holy-knights-fc-away.png',
    },
  },
};

export const getTeamKitAssets = (
  seasonId: SeasonId,
  teamId: string,
): TeamKitAssetPair | undefined => TEAM_KIT_ASSETS[seasonId]?.[teamId];
