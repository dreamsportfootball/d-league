import fs from 'node:fs/promises';
import path from 'node:path';
import { SEASON_IDS, SITE_URL } from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const fail = (message) => { throw new Error(message); };
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));
const safeSegment = (value, label) => {
  const text = String(value ?? '');
  if (!text || text.includes('/')) fail(`Invalid ${label}: ${text}`);
  return encodeURIComponent(text);
};

const expectedRoutes = [];

for (const seasonId of SEASON_IDS) {
  const matches = await readJson(seasonId, 'matches.json');
  const groups = new Map();
  matches.forEach((match) => {
    const key = `${match.league}::${String(match.round)}`;
    if (!groups.has(key)) groups.set(key, match);
  });

  for (const match of groups.values()) {
    const route = `/rounds/${seasonId}/${safeSegment(match.league, 'league')}/${safeSegment(match.round, 'round')}`;
    expectedRoutes.push(route);
    const filePath = path.join(distDir, route.replace(/^\//, ''), 'index.html');
    const html = await fs.readFile(filePath, 'utf8');
    const canonical = `${SITE_URL}${route}`;

    if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
      fail(`${route}: canonical URL missing`);
    }
    if (!html.includes('"@type":"CollectionPage"')) {
      fail(`${route}: CollectionPage schema missing`);
    }
    if (!html.includes('"@type":"ItemList"')) {
      fail(`${route}: ItemList schema missing`);
    }
    if (!html.includes('id="static-seo-content"')) {
      fail(`${route}: static readable body missing`);
    }
    if (!html.includes(`第 ${match.round} 輪`) || !html.includes('本輪數據')) {
      fail(`${route}: round data content missing`);
    }
    if (html.includes(`${SITE_URL}/matches/`)) {
      fail(`${route}: round page must not link to compatibility match URLs`);
    }
    if (html.includes('數據洞察')) {
      fail(`${route}: legacy insight wording remains`);
    }
    if (html.includes('%BASE_URL%')) {
      fail(`${route}: unresolved Vite placeholder`);
    }
  }
}

const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
for (const route of expectedRoutes) {
  if (!sitemap.includes(`<loc>${SITE_URL}${route}</loc>`)) {
    fail(`sitemap.xml: ${route} missing`);
  }
}

console.log(`Static round SEO validation passed for ${expectedRoutes.length} routes`);
