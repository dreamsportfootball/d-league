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
  {
    canonicalRoute = route,
    requireStaticBody = true,
    requireSchema = true,
    schemaType,
  } = {},
) => {
  const html = await fs.readFile(routeFile(route), 'utf8');
  const canonicalUrl = `${SITE_URL}${canonicalRoute === '/' ? '/' : canonicalRoute}`;
  if (!html.includes(`<link rel="canonical" href="${canonicalUrl}"`)) {
    fail(`${route}: canonical URL missing or incorrect (expected ${canonicalRoute})`);
  }
  if (requireSchema && !html.includes('data-static-seo')) fail(`${route}: JSON-LD missing`);
  if (!requireSchema && html.includes('data-static-seo')) fail(`${route}: unexpected JSON-LD on compatibility route`);
  if (schemaType && !html.includes(`"@type":"${schemaType}"`)) {
    fail(`${route}: ${schemaType} schema missing`);
  }
  if (!html.includes('twitter:title')) fail(`${route}: Twitter metadata missing`);
  if (expectedText && !html.includes(expectedText)) fail(`${route}: expected content missing`);
  if (requireStaticBody && !html.includes('id="static-seo-content"')) {
    fail(`${route}: static readable body missing`);
  }
  if (html.includes('%BASE_URL%')) fail(`${route}: unresolved Vite placeholder`);
  return html;
};

for (const [route, entry] of Object.entries(PAGE_SEO)) {
  await checkHtml(route, entry.label);
}

const teamCanonicalIds = new Set();
const playerCanonicalIds = new Set();
const matchIds = new Set();
const latestTeamNameByCanonicalId = new Map();
const latestPlayerNameByCanonicalId = new Map();

// SEASON_IDS is ordered oldest to newest. Canonical entity pages are rendered
// from the latest record in each identity group, so validation must expect the
// latest public name rather than a historical name when route IDs collide.
for (const seasonId of SEASON_IDS) {
  const teams = await readJson(seasonId, 'teams.json');
  const players = await readJson(seasonId, 'players.json');

  for (const team of teams) {
    latestTeamNameByCanonicalId.set(team.identityId ?? team.id, team.name);
  }
  for (const player of players) {
    latestPlayerNameByCanonicalId.set(player.identityId ?? player.id, player.name);
  }
}

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
    const expectedTeamName = latestTeamNameByCanonicalId.get(canonicalId) ?? team.name;
    teamCanonicalIds.add(canonicalId);
    await checkHtml(`/teams/${team.id}`, expectedTeamName, {
      canonicalRoute: `/teams/${canonicalId}`,
      schemaType: 'SportsTeam',
    });
    await checkHtml(`/teams/${canonicalId}`, expectedTeamName, {
      canonicalRoute: `/teams/${canonicalId}`,
      schemaType: 'SportsTeam',
    });
  }

  for (const player of players) {
    const canonicalId = player.identityId ?? player.id;
    const expectedPlayerName = latestPlayerNameByCanonicalId.get(canonicalId) ?? player.name;
    playerCanonicalIds.add(canonicalId);
    await checkHtml(`/players/${player.id}`, expectedPlayerName, {
      canonicalRoute: `/players/${canonicalId}`,
      schemaType: 'Person',
    });
    await checkHtml(`/players/${canonicalId}`, expectedPlayerName, {
      canonicalRoute: `/players/${canonicalId}`,
      schemaType: 'Person',
    });
  }

  for (const match of matches) {
    if (matchIds.has(match.id)) fail(`duplicate match id across seasons: ${match.id}`);
    matchIds.add(match.id);
    const route = `/matches/${match.id}`;
    const html = await checkHtml(route, '賽程與結果', {
      canonicalRoute: '/schedule',
      requireSchema: false,
    });
    if (!html.includes('name="robots" content="noindex,follow"')) {
      fail(`${route}: compatibility route must be noindex,follow`);
    }
    if (html.includes('SportsEvent') || html.includes('數據洞察')) {
      fail(`${route}: standalone match SEO content must not be restored`);
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
  if (sitemap.includes(`<loc>${SITE_URL}/matches/${id}</loc>`)) {
    fail(`sitemap.xml: compatibility match ${id} must not be indexed`);
  }
}

const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  fail('robots.txt: sitemap URL missing');
}

console.log('Static SEO validation passed');
