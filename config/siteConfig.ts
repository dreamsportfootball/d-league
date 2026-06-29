import { CURRENT_SEASON_ID } from './siteManifest.js';
import type { LeagueId, RegistrationProgressConfig } from '../types/season';

interface StaffPartnerTeamPopupConfig {
  enabled: boolean;
  storageKey: string;
  showDelayMs: number;
  eyebrow: string;
  title: string;
  introQuestion: string;
  introCallout: string;
  targetLeagues: readonly LeagueId[];
  slotsPerLeague: number;
  offerEyebrow: string;
  offerTitle: string;
  offerNote: string;
  tasks: readonly string[];
  benefits: readonly string[];
  supportNote: string;
  ctaLabel: string;
  ctaUrl: string;
}

export { CURRENT_SEASON_ID };
export const SHOW_REGISTRATION_NAV = true;
export const D_LEAGUE_INSTAGRAM_URL = 'https://www.instagram.com/d.league_tw/';

export const CURRENT_REGISTRATION_PROGRESS: RegistrationProgressConfig = {
  receivedTeams: 12,
  updatedAt: '2026-06-27',
  note: '報名隊數不代表最終錄取結果，正式參賽級別及錄取名單以主辦單位公告為準；若報名球隊數已達預定名額，主辦單位得提前截止報名',
};

export const STAFF_PARTNER_TEAM_POPUP: StaffPartnerTeamPopupConfig = {
  enabled: true,
  storageKey: 'dleague:staff-partner-team-popup:2026-27:v1',
  showDelayMs: 300,
  eyebrow: 'D LEAGUE 工作人員合作隊招募',
  title: '踢聯賽，也成為比賽日的一份子',
  introQuestion: '想參加新賽季，同時減輕球隊報名費負擔？',
  introCallout: '現正招募工作人員合作隊伍',
  targetLeagues: ['L2', 'L3'],
  slotsPerLeague: 1,
  offerEyebrow: '合作隊報名費優惠',
  offerTitle: '專屬報名費方案',
  offerNote: '實際優惠內容及合作方式請私訊確認',
  tasks: ['器材搬運', '場地設置', '比賽期間撿球', '賽後場地整理'],
  benefits: ['優先錄取資格', '比賽日提供飲料及便當'],
  supportNote: '實際合作安排及錄取結果以主辦單位最終確認為準',
  ctaLabel: '私訊了解報名費優惠',
  ctaUrl: D_LEAGUE_INSTAGRAM_URL,
};
