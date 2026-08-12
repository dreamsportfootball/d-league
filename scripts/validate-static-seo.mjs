import fs from 'node:fs/promises';
import path from 'node:path';
import { PAGE_SEO, SEASON_IDS, SITE_URL } from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const fail = (message) => { throw new Error(message); };
const routeFile = (route) => route === '/'
  ? path.join(distDir, 'index.html')
  : path.join(distDir, route.replace(/^\//, ''), 'index.html');
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));

const checkHtml = async (
  route,
  expectedText,
  { canonicalRoute = route, requireStaticBody = true, schemaType } = {},
) => {
  const html = await fs.readFile(routeFile(route), 'utf8');
  const canonicalUrl = `${SITE_URL}${canonicalRoute === '/' ? '/' : canonicalRoute}`;
  if (!html.includes(`<link rel="canonical" href="${canonicalUrl}"`)) {
    fail(`${route}: canonical URL missing or incorrect (expected ${canonicalRoute})`);
  }
  if (!html.includes('data-static-seo')) fail(`${route}: JSON-LD missing`);
  if (schemaType && !html.includes(`"@type":"${schemaType}"`)) {
    fail(`${route}: ${schemaType} schema missing`);
  }
  if (!html.includes('twitter:title')) fail(`${route}: Twitter metadata missing`);
  if (expectedText && !html.includes(expectedText)) fail(`${route}: expected content missing`);
  if (requireStaticBody && !html.includes('id="static-seo-content"')) {
    fail(`${route}: static readable body missing`);
  }
  if (html.includes('%BASE_URL%')) fail(`${route}: unresolved Vite placeholder`);
};

for (const [route, entry] of Object.entries(PAGE_SEO)) {
  await checkHtml(route, entry.label);
}

const teamCanonicalIds = new Set();
const playerCanonicalIds = new Set();
const matchIds = new Set();

for (const seasonId of SEASON_IDS) {
  const articles = await readJson(seasonId, 'news.json');
  const teams = await readJson(seasonId, 'teams.json');
  const players = await readJson(seasonId, 'players.json');
  const matches = await readJson(seasonId, 'matches.json');

  for (const article of articles) {
    await checkHtml(`/news/${article.id}`, article.title, { schemaType: 'NewsArticle' });
  }

  for (const team of teams) {
    const canonicalId = team.identityId ?? team.id;
    teamCanonicalIds.add(canonicalId);
    await checkHtml(`/teams/${team.id}`, team.name, {
      canonicalRoute: `/teams/${canonicalId}`,
      schemaType: 'SportsTeam',
    });
    await checkHtml(`/teams/${canonicalId}`, team.name, {
      canonicalRoute: `/teams/${canonicalId}`,
      schemaType: 'SportsTeam',
    });
  }

  for (const player of players) {
    const canonicalId = player.identityId ?? player.id;
    playerCanonicalIds.add(canonicalId);
    await checkHtml(`/players/${player.id}`, player.name, {
      canonicalRoute: `/players/${canonicalId}`,
      schemaType: 'Person',
    });
    await checkHtml(`/players/${canonicalId}`, player.name, {
      canonicalRoute: `/players/${canonicalId}`,
      schemaType: 'Person',
    });
  }

  for (const match of matches) {
    if (matchIds.has(match.id)) fail(`duplicate match id across seasons: ${match.id}`);
    matchIds.add(match.id);
    const home = teams.find((team) => team.id === match.homeTeamId);
    const away = teams.find((team) => team.id === match.awayTeamId);
    if (!home || !away) continue;
    await checkHtml(`/matches/${match.id}`, `${home.name}`, { schemaType: 'SportsEvent' });
    const matchHtml = await fs.readFile(routeFile(`/matches/${match.id}`), 'utf8');
    if (!matchHtml.includes(`第 ${match.round} 輪數據洞察`)) {
      fail(`/matches/${match.id}: round insights missing from static body`);
    }
  }
}

const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
for (const route of Object.keys(PAGE_SEO)) {
  const url = `${SITE_URL}${route === '/' ? '/' : route}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`sitemap.xml: ${route} missing`);
}
for (const id of teamCanonicalIds) {
  if (!sitemap.includes(`<loc>${SITE_URL}/teams/${id}</loc>`)) {
    fail(`sitemap.xml: team ${id} missing`);
  }
}
for (const id of playerCanonicalIds) {
  if (!sitemap.includes(`<loc>${SITE_URL}/players/${id}</loc>`)) {
    fail(`sitemap.xml: player ${id} missing`);
  }
}
for (const id of matchIds) {
  if (!sitemap.includes(`<loc>${SITE_URL}/matches/${id}</loc>`)) {
    fail(`sitemap.xml: match ${id} missing`);
  }
}

const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  fail('robots.txt: sitemap URL missing');
}

console.log('Static SEO validation passed');
