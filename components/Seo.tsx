import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeasonConfig, isSeasonId } from '../config/seasons';
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, PAGE_SEO, SITE_NAME, SITE_URL } from '../config/siteManifest.js';
import { CUP_EVENT } from '../cupData';
import { getMatchRecord, getPlayerHistory, getTeamHistory } from '../services/entityData';
import { getNewsArticle } from '../services/seasonDataJson';

interface PageSeoEntry { label: string; description: string; }
const pageSeo = PAGE_SEO as Record<string, PageSeoEntry>;

const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
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
  const metadata = useMemo(() => {
    const pathname = location.pathname;
    const routeId = decodeURIComponent(pathname.split('/').filter(Boolean)[1] ?? '');
    const query = new URLSearchParams(location.search);
    const requestedSeason = query.get('season');
    const preferredSeason = isSeasonId(requestedSeason) ? requestedSeason : undefined;
    const article = pathname.startsWith('/news/') ? getNewsArticle(routeId) : null;

    if (article) {
      const articleSeason = article.seasonId ? getSeasonConfig(article.seasonId) : undefined;
      return { title: `${article.title}｜${articleSeason?.displayName ?? SITE_NAME}`, description: article.summary || DEFAULT_DESCRIPTION, image: absoluteAssetUrl(article.imageUrl), type: 'article', canonicalPath: pathname };
    }

    if (pathname.startsWith('/matches/')) {
      const record = getMatchRecord(routeId, preferredSeason);
      if (record?.homeTeam && record.awayTeam) {
        const score = record.match.homeScore !== null && record.match.awayScore !== null ? `${record.match.homeScore}-${record.match.awayScore}` : 'vs';
        return { title: `${record.homeTeam.shortName} ${score} ${record.awayTeam.shortName}｜${record.season.displayName}`, description: `${record.season.displayName} ${record.match.league} 第 ${record.match.round} 輪，${record.homeTeam.name} 對 ${record.awayTeam.name} 的時間、地點、比數與比賽事件`, image: absoluteAssetUrl(record.homeTeam.logo), type: 'website', canonicalPath: pathname };
      }
    }

    if (pathname.startsWith('/players/')) {
      const history = getPlayerHistory(routeId);
      const record = (preferredSeason ? history.find((candidate) => candidate.seasonId === preferredSeason) : undefined) ?? history[0];
      if (record) return { title: `${record.player.name}｜D LEAGUE 球員資料`, description: `${record.player.name} 的 D LEAGUE 歷年球隊、進球、紅黃牌與比賽事件`, image: absoluteAssetUrl(record.data.playerImages[record.player.name]), type: 'profile', canonicalPath: pathname };
    }

    if (pathname.startsWith('/teams/')) {
      const history = getTeamHistory(routeId);
      const record = (preferredSeason ? history.find((candidate) => candidate.seasonId === preferredSeason) : undefined) ?? history[0];
      if (record) return { title: `${record.team.name}｜D LEAGUE 球隊資料`, description: `${record.team.name} 的 D LEAGUE 歷年賽季、球員名單、賽程、賽果、積分與球隊數據`, image: absoluteAssetUrl(record.team.logo), type: 'website', canonicalPath: pathname };
    }

    if (pathname === '/cup') return { title: `${CUP_EVENT.name}｜${SITE_NAME}`, description: `${CUP_EVENT.name}完整賽果、冠亞季軍、參賽球隊及賽事影像`, image: absoluteAssetUrl(CUP_EVENT.heroImage), type: 'website', canonicalPath: pathname };
    const basePage = pageSeo[pathname] ?? { label: '找不到此頁面', description: DEFAULT_DESCRIPTION };
    return { title: `${basePage.label}｜${SITE_NAME}`, description: basePage.description, image: absoluteAssetUrl(DEFAULT_SOCIAL_IMAGE), type: 'website', canonicalPath: pathname };
  }, [location.pathname, location.search]);

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
    const canonicalUrl = `${SITE_URL}${metadata.canonicalPath === '/' ? '/' : metadata.canonicalPath}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
  }, [metadata]);

  return null;
};

export default Seo;
