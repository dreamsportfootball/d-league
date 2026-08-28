import season2026TeamBranding from '../data/seasons/2026-27/teamBranding.json';
import type { SeasonId } from '../types/season';
import type { TeamBrandingAsset } from '../types/team';
import { assetUrl } from './seasonData';

type TeamBrandingMap = Readonly<Record<string, TeamBrandingAsset>>;

const TEAM_BRANDING_BY_SEASON: Partial<Record<SeasonId, TeamBrandingMap>> = {
  '2026-27': season2026TeamBranding as TeamBrandingMap,
};

export const getTeamBranding = (
  seasonId: SeasonId,
  teamName: string,
): TeamBrandingAsset | null => TEAM_BRANDING_BY_SEASON[seasonId]?.[teamName] ?? null;

export const getTeamLogoUrl = (seasonId: SeasonId, teamName: string): string | null => {
  const branding = getTeamBranding(seasonId, teamName);
  if (!branding) return null;
  return assetUrl(`assets/seasons/${seasonId}/teams/${branding.logoFile}`);
};
