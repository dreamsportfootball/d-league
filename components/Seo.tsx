import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from '../config/siteManifest.js';
import { CUP_EVENT } from '../cupData';
import { useSeason } from '../hooks/useSeason';
import { getNewsArticle } from '../services/seasonDataJson';

interface PageSeoEntry {
  label: string;
  description: string;
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

const Seo: React.FC = () => {
  const location = useLocation();
  const { activeSeason, seasonData } = useSeason();

  const metadata = useMemo(() => {
    const pathname = location.pathname;
    const routeId = decodeURIComponent(pathname.split('/').filter(Boolean)[1] ?? '');
    const article = pathname.startsWith('/news/') ? getNewsArticle(routeId) : null;
    const team = pathname.startsWith('/teams/')
      ? seasonData.teamMap[routeId]
      : undefined;
    const matchId = new URLSearchParams(location.search).get('match');
    const match = matchId ? seasonData.matches.find((item) => item.id === matchId) : undefined;

    if (article) {
      const articleSeason = article.seasonId ? getSeasonConfig(article.seasonId) : activeSeason;
      return {
        title: `${article.title}｜${articleSeason.displayName}｜${SITE_NAME}`,
        description: article.summary || DEFAULT_DESCRIPTION,
        image: absoluteAssetUrl(
          article.imageUrl || articleSeason.heroImageDesktop || articleSeason.heroFallbackImage,
        ),
        type: 'article',
      };
    }

    if (team) {
      return {
        title: `${team.name}｜${activeSeason.displayName}｜${SITE_NAME}`,
        description: `${team.name}於 ${activeSeason.displayName} ${team.leagueId} 的球員名單、賽程、賽果及球隊數據`,
        image: absoluteAssetUrl(team.logo),
        type: 'website',
      };
    }

    if (match) {
      const home = seasonData.teamMap[match.homeTeamId];
      const away = seasonData.teamMap[match.awayTeamId];
      return {
        title: `${home?.shortName ?? match.homeTeamId} vs ${away?.shortName ?? match.awayTeamId}｜${activeSeason.displayName}`,
        description: `${match.league} 第 ${match.round} 輪比賽詳情、時間、地點、比數及比賽事件`,
        image: absoluteAssetUrl(activeSeason.heroImageDesktop ?? activeSeason.heroFallbackImage),
        type: 'website',
      };
    }

    if (pathname === '/cup') {
      return {
        title: `${CUP_EVENT.name}｜${SITE_NAME}`,
        description: `${CUP_EVENT.name}完整賽果、冠亞季軍、參賽球隊及賽事影像`,
        image: absoluteAssetUrl(CUP_EVENT.heroImage),
        type: 'website',
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

    return {
      title: `${basePage.label}｜${SITE_NAME}`,
      description: seasonDescriptions[pathname] ?? basePage.description,
      image: absoluteAssetUrl(activeSeason.heroImageDesktop ?? activeSeason.heroFallbackImage),
      type: 'website',
    };
  }, [activeSeason, location.pathname, location.search, seasonData.matches, seasonData.teamMap]);

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

    const canonicalUrl = `${SITE_URL}${location.pathname === '/' ? '/' : location.pathname}${location.search}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [location.pathname, location.search, metadata]);

  return null;
};

export default Seo;
