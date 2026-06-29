import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CURRENT_SEASON_ID,
  PAGE_SEO,
  SEASON_IDS,
  SITE_NAME,
  SITE_URL,
} from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const fail = (message) => { throw new Error(message); };
const routeFile = (route) => route === '/'
  ? path.join(distDir, 'index.html')
  : path.join(distDir, route.replace(/^\//, ''), 'index.html');

const checkHtml = async (route, expectedText) => {
  const html = await fs.readFile(routeFile(route), 'utf8');
  if (!html.includes(`<link rel="canonical" href="${SITE_URL}${route === '/' ? '/' : route}"`)) {
    fail(`${route}: canonical URL missing`);
  }
  if (!html.includes('data-static-seo')) fail(`${route}: JSON-LD missing`);
  if (!html.includes('twitter:title')) fail(`${route}: Twitter metadata missing`);
  if (!html.includes(expectedText)) fail(`${route}: expected metadata text missing`);
  if (html.includes('%BASE_URL%')) fail(`${route}: unresolved Vite placeholder`);
};

for (const [route, entry] of Object.entries(PAGE_SEO)) {
  await checkHtml(route, entry.label);
}

for (const seasonId of SEASON_IDS) {
  const articles = JSON.parse(
    await fs.readFile(path.join(dataDir, seasonId, 'news.json'), 'utf8'),
  );
  for (const article of articles) {
    await checkHtml(`/news/${article.id}`, article.title);
  }
}

const teams = JSON.parse(
  await fs.readFile(path.join(dataDir, CURRENT_SEASON_ID, 'teams.json'), 'utf8'),
);
for (const team of teams) {
  await checkHtml(`/teams/${team.id}`, team.name);
}

const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes(`${SITE_URL}/news`)) fail('sitemap.xml: news route missing');
if (!sitemap.includes(SITE_NAME.split('｜')[0])) {
  // Site name is not required in the sitemap, but this guards against reading the wrong output file.
  if (!sitemap.includes('<urlset')) fail('sitemap.xml: invalid document');
}

const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail('robots.txt: sitemap URL missing');

console.log('Static SEO validation passed');
