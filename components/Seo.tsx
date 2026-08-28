import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeasonConfig, isSeasonId } from '../config/seasons';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from '../config/siteManifest.js';
import { CUP_EVENT } from '../cupData';
import { useSeason } from '../hooks/useSeason';
import {
  getMatchRecord,
  getPlayerHistory,
  getPlayerSeasonStats,
  getTeamHistory,
  getTeamIdentity,
} from '../services/entityData';
import { getNewsArticle, getSeasonData } from '../services/seasonDataJson';

interface PageSeoEntry {
  label: string;
  description: string;
}

interface PageMetadata {
  title: string;
  description: string;
  image: string;
  type: 'website' | 'article';
  canonicalPath: string;
}

const pageSeo = PAGE_SEO as Record<string, PageSeoEntry>;

const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const absoluteAssetUrl = (value?: string): string => {
  const asset = value || DEFAULT_SOCIAL_IMAGE;
  if (/^https?:\/\//.test(asset)) return asset;
  const clean = asset.replace(/^\/+/, '').replace(/^d-league\//, '');
  return `${SITE_URL}/${clean}`;
};

const selectSeasonRecord = <T extends { seasonId: string }>(records: T[], requestedSeason: string | null): T | undefined => {
  if (isSeasonId(requestedSeason)) {
    const requested = records.find((record) => record.seasonId === requestedSeason);
    if (requested) return requested;
  }
  return records[0];
};

const Seo: React.FC = () => {
  const location = useLocation();
  const { activeSeason } = useSeason();

  const metadata = useMemo<PageMetadata>(() => {
    const pathname = location.pathname;
    const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const routeId = segments[1] ?? '';
    const searchParams = new URLSearchParams(location.search);
    const requestedSeason = searchParams.get('season');
    const preferredSeason = isSeasonId(requestedSeason) ? requestedSeason : undefined;
    const legacyMatchId = searchParams.get('match');
    const matchId = pathname.startsWith('/matches/') ? routeId : legacyMatchId;

    if (pathname.startsWith('/rounds/')) {
      const seasonId = segments[1];
      const league = segments[2];
      const round = segments[3];
      if (isSeasonId(seasonId) && (league === 'L1' || league === 'L2' || league === 'L3') && round) {
        const season = getSeasonConfig(seasonId);
        const data = getSeasonData(seasonId);
        const matches = data.matches.filter(
          (match) => match.league === league && String(match.round) === round,
        );
        if (matches.length > 0) {
          const completed = matches.filter(
            (match) => match.homeScore !== null && match.awayScore !== null,
          );
          const totalGoals = completed.reduce(
            (sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0),
            0,
          );
          return {
            title: `${season.shortName} ${league} 第 ${round} 輪｜D LEAGUE 官方數據｜${SITE_NAME}`,
            description: `${season.displayName} ${league} 第 ${round} 輪官方賽程、賽果與本輪數據；已完成 ${completed.length} 場、本輪目前共 ${totalGoals} 球`,
            image: absoluteAssetUrl(season.heroImageDesktop ?? season.heroFallbackImage),
            type: 'website',
            canonicalPath: `/rounds/${seasonId}/${league}/${encodeURIComponent(round)}`,
          };
        }
      }
    }

    if (matchId) {
      const record = getMatchRecord(matchId, preferredSeason);
      if (record?.homeTeam && record.awayTeam) {
        const { match, homeTeam, awayTeam, season } = record;
        const score = match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore}-${match.awayScore}`
          : 'vs';
        return {
          title: `${homeTeam.shortName} ${score} ${awayTeam.shortName}｜${season.displayName}｜${SITE_NAME}`,
          description: `${season.displayName} ${match.league} 第 ${match.round} 輪：${homeTeam.name} 對 ${awayTeam.name}，比賽時間、地點、比數、進球與紅黃牌官方紀錄`,
          image: absoluteAssetUrl(season.heroImageDesktop ?? season.heroFallbackImage),
          type: 'website',
          canonicalPath: `/matches/${encodeURIComponent(match.id)}`,
        };
      }
    }

    if (pathname.startsWith('/players/')) {
      const history = getPlayerHistory(routeId);
      const record = selectSeasonRecord(history, requestedSeason);
      if (record) {
        const totals = history.reduce(
          (acc, item) => {
            const stats = getPlayerSeasonStats(item);
            acc.goals += stats.goals;
            acc.yellowCards += stats.yellowCards;
            acc.redCards += stats.directRedCards + stats.secondYellowDismissals;
            return acc;
          },
          { goals: 0, yellowCards: 0, redCards: 0 },
        );
        return {
          title: `${record.player.name}｜D LEAGUE 官方球員資料｜${SITE_NAME}`,
          description: `${record.player.name} D LEAGUE 官方球員頁，包含歷年效力球隊、賽季紀錄、進球 ${totals.goals} 球、黃牌 ${totals.yellowCards} 張、紅牌 ${totals.redCards} 張及比賽事件`,
          image: absoluteAssetUrl(record.data.playerImages[record.player.name]),
          type: 'website',
          canonicalPath: `/players/${encodeURIComponent(record.player.identityId ?? record.player.id)}`,
        };
      }
    }

    if (pathname.startsWith('/teams/')) {
      const history = getTeamHistory(routeId);
      const record = selectSeasonRecord(history, requestedSeason);
      if (record) {
        return {
          title: `${record.team.name}｜D LEAGUE 官方球隊資料｜${SITE_NAME}`,
          description: `${record.team.name} D LEAGUE 官方球隊頁，提供歷年參賽賽季、球員名單、賽程、賽果、排名與球隊數據`,
          image: absoluteAssetUrl(record.team.logo),
          type: 'website',
          canonicalPath: `/teams/${encodeURIComponent(getTeamIdentity(record.team))}`,
        };
      }
    }

    const article = pathname.startsWith('/news/') ? getNewsArticle(routeId) : null;
    if (article) {
      const articleSeason = article.seasonId ? getSeasonConfig(article.seasonId) : activeSeason;
      return {
        title: `${article.title}｜${articleSeason.displayName}｜${SITE_NAME}`,
        description: article.summary || DEFAULT_DESCRIPTION,
        image: absoluteAssetUrl(article.imageUrl || articleSeason.heroImageDesktop || articleSeason.heroFallbackImage),
        type: 'article',
        canonicalPath: `/news/${encodeURIComponent(article.id)}`,
      };
    }

    if (pathname === '/cup') {
      return {
        title: `${CUP_EVENT.name}｜${SITE_NAME}`,
        description: `${CUP_EVENT.name}完整賽果、冠亞季軍、參賽球隊及賽事影像`,
        image: absoluteAssetUrl(CUP_EVENT.heroImage),
        type: 'website',
        canonicalPath: '/cup',
      };
    }

    const basePage = pageSeo[pathname] ?? {
      label: '找不到此頁面',
      description: DEFAULT_DESCRIPTION,
    };
    const seasonDescriptions: Record<string, string> = {
      '/schedule': `${activeSeason.displayName} 完整賽程、比賽結果及事件詳情`,
      '/standings': `${activeSeason.displayName} ${activeSeason.enabledLeagues.join('、')} 最新積分及排名`,
      '/stats': `${activeSeason.displayName} 射手榜、紅黃牌、停賽與紀律資料`,
      '/media': `${activeSeason.displayName} 比賽影片、相簿及賽事媒體內容`,
    };
    const canonicalSearch = new URLSearchParams(location.search);
    canonicalSearch.delete('match');
    const canonicalQuery = canonicalSearch.toString();

    return {
      title: `${basePage.label}｜${SITE_NAME}`,
      description: seasonDescriptions[pathname] ?? basePage.description,
      image: absoluteAssetUrl(activeSeason.heroImageDesktop ?? activeSeason.heroFallbackImage),
      type: 'website',
      canonicalPath: `${pathname === '/' ? '/' : pathname}${canonicalQuery ? `?${canonicalQuery}` : ''}`,
    };
  }, [activeSeason, location.pathname, location.search]);

  useEffect(() => {
    document.title = metadata.title;
    setMeta('meta[name="description"]', 'name', 'description', metadata.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', metadata.image);
    setMeta('meta[property="og:type"]', 'property', 'og:type', metadata.type);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', metadata.image);

    const canonicalUrl = `${SITE_URL}${metadata.canonicalPath}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [metadata]);

  return null;
};

export default Seo;
