import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { CUP_EVENT } from '../cupData';
import { useSeason } from '../hooks/useSeason';
import { getNewsArticle } from '../services/seasonDataJson';

const SITE_NAME = 'D LEAGUE｜台南夢達七人足球聯賽';
const SITE_URL = 'https://dreamsportfootball.github.io/d-league';
const DEFAULT_DESCRIPTION = 'D LEAGUE 台南夢達七人足球聯賽，提供賽季報名、賽程結果、積分榜、球隊資料、球員數據與賽事消息';

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
  if (!value) return `${SITE_URL}/banner.png`;
  if (/^https?:\/\//.test(value)) return value;
  const clean = value.replace(/^\/+/, '').replace(/^d-league\//, '');
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

    const pageMap: Record<string, { label: string; description: string }> = {
      '/': { label: activeSeason.displayName, description: DEFAULT_DESCRIPTION },
      '/registration': { label: '賽季報名', description: `${activeSeason.displayName} 報名資格、賽制、流程及常見問題` },
      '/schedule': { label: '賽程與結果', description: `${activeSeason.displayName} 完整賽程、比賽結果及事件詳情` },
      '/standings': { label: '積分榜', description: `${activeSeason.displayName} L1、L2、L3 最新積分及排名` },
      '/stats': { label: '數據中心', description: `${activeSeason.displayName} 射手榜、紅黃牌、停賽與紀律資料` },
      '/news': { label: '最新消息', description: 'D LEAGUE 官方公告、賽事戰報與過往賽季消息' },
      '/media': { label: '賽事媒體', description: 'D LEAGUE 比賽影片、相簿及賽事媒體內容' },
      '/about': { label: '關於我們', description: '認識 D LEAGUE 台南夢達七人足球聯賽' },
    };
    const page = pageMap[pathname] ?? { label: '找不到此頁面', description: DEFAULT_DESCRIPTION };
    return {
      title: `${page.label}｜${SITE_NAME}`,
      description: page.description,
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
