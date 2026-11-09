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

type TeamKitVariant = keyof TeamKitAssetPair;

// A match-specific kit choice does not change a club's registered home/away kits.
const MATCH_TEAM_KIT_VARIANTS: Partial<
  Record<SeasonId, Record<string, Record<string, TeamKitVariant>>>
> = {
  '2026-27': {
    'm2627-003': {
      // Matchday exception: away team wears its black home kit by organizer approval.
      t_kaohsiung_black_knights_2026: 'home',
    },
    'm2627-004': {
      t_kaohsiung_amateur_2026: 'home',
    },
    'm2627-006': {
      // One-match exception: SOUTHBOYS wears white away; Pingtung wears purple home.
      t_southboys_2026: 'away',
      t_pingtung_wild_ape_2026: 'home',
    },
    'm2627-008': {
      // Organizer-approved color separation: 2026-11-08 L3 Wolves vs Luzhu: Luzhu blue home.
      t_luzhu_2026: 'home',
    },
    'm2627-010': {
      // 2026-11-15 L2 R2: organizer's latest decision: Kaohsiung Hongkongers wear yellow-black home kit against Pingtung Wild Ape.
      t_kaohsiung_hk_2026: 'home',
    },
    'm2627-019': {
      // Organizer-approved color separation: 2026-12-06 L1 KUROMI vs Chiayi 235: Chiayi light gray-blue home.
      t_chiayi_235_2026: 'home',
    },
    'm2627-024': {
      // Organizer-approved color separation: 2026-12-06 L2 SOUTHBOYS vs Kaohsiung Hongkongers: yellow-black home.
      t_kaohsiung_hk_2026: 'home',
    },
    'm2627-025': {
      // Organizer-approved color separation: 2026-12-13 L3 Holy Knights vs SF: SF pink home.
      t_sf_2026: 'home',
    },
    'm2627-031': {
      // Organizer-approved color separation: 2026-12-20 L1 Alian vs Chiayi 235: Chiayi light gray-blue home.
      t_chiayi_235_2026: 'home',
    },
    'm2627-040': {
      // Organizer-approved color separation: 2027-01-17 L3 Niaoshi vs Wolves: Wolves white home.
      t_pingtung_wolves_2026: 'home',
    },
    'm2627-044': {
      // Organizer-approved color separation: 2027-01-24 L2 Black Wolf vs Kaohsiung Hongkongers: yellow-black home.
      t_kaohsiung_hk_2026: 'home',
    },
    'm2627-046': {
      // Organizer-approved color separation: 2027-01-24 L1 Evergreen vs Chen: Chen navy home.
      t_chen_2026: 'home',
    },
    'm2627-047': {
      // Organizer-approved color separation: 2027-01-24 L1 Black Knights vs Chiayi 235: Chiayi light gray-blue home.
      t_chiayi_235_2026: 'home',
    },
    'm2627-063': {
      // Organizer-approved color separation: 2027-03-07 L3 SF vs Wolves: Wolves white home.
      t_pingtung_wolves_2026: 'home',
    },
    'm2627-066': {
      // Organizer-approved color separation: 2027-03-14 L2 Black Wolf vs Amateur: Amateur red home.
      t_kaohsiung_amateur_2026: 'home',
    },
    'm2627-070': {
      // Organizer-approved color separation: 2027-03-21 L3 Wolves vs Wanderers: Wanderers navy home.
      t_wanderers_2026: 'home',
    },
    'm2627-071': {
      // Organizer-approved color separation: 2027-03-21 L3 SF vs Holy Knights: Holy Knights navy home.
      t_holy_knights_2026: 'home',
    },
    'm2627-074': {
      // Organizer-approved color separation: 2027-03-28 L3 Wanderers vs SF: SF pink home.
      t_sf_2026: 'home',
    },
    'm2627-078': {
      // Organizer-approved color separation: 2027-04-11 L1 Chiayi 235 vs Alian: Alian black home.
      t_alian_2026: 'home',
    },
    'm2627-084': {
      // Organizer-approved color separation: 2027-04-18 L3 Luzhu vs SF: SF pink home.
      t_sf_2026: 'home',
    },
    'm2627-086': {
      // Organizer-approved color separation: 2027-04-25 L2 Tongque vs Kaohsiung Hongkongers: yellow-black home.
      t_kaohsiung_hk_2026: 'home',
    },
    'm2627-056': {
      // Organizer-approved: Chen wears pink away; Chiayi 235 keeps its default away kit.
      t_chen_2026: 'away',
    },
    'm2627-087': {
      // Organizer-approved: Kaohsiung Amateur wears red home against Pingtung Wild Ape.
      t_kaohsiung_amateur_2026: 'home',
    },
  },
};

export const getMatchTeamKitVariant = (
  seasonId: SeasonId,
  matchId: string,
  teamId: string,
  defaultVariant: TeamKitVariant,
): TeamKitVariant => MATCH_TEAM_KIT_VARIANTS[seasonId]?.[matchId]?.[teamId] ?? defaultVariant;
