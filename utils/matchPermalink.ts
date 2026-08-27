import { SITE_URL } from '../config/siteManifest.js';

export const getMatchRoute = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}`;

export const buildMatchPermalink = (matchId: string): string => {
  const route = getMatchRoute(matchId);

  if (import.meta.env.VITE_ROUTER_MODE === 'hash' && typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}#${route}`;
  }

  return `${SITE_URL}${route}`;
};
