import fs from 'node:fs/promises';
import path from 'node:path';
import { PAGE_SEO, SEASON_IDS, SITE_NAME, SITE_URL } from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const fail = (message) => { throw new Error(message); };
const routeFile = (route) => route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.replace(/^\//, ''), 'index.html');
const checkHtml = async (route, expectedText, { requireStaticBody = true } = {}) => {
  const html = await fs.readFile(routeFile(route), 'utf8');
  if (!html.includes(`<link rel="canonical" href="${SITE_URL}${route === '/' ? '/' : route}"`)) fail(`${route}: canonical URL missing`);
  if (!html.includes('data-static-seo')) fail(`${route}: JSON-LD missing`);
  if (!html.includes('twitter:title')) fail(`${route}: Twitter metadata missing`);
  if (!html.includes(expectedText)) fail(`${route}: expected metadata text missing`);
  if (requireStaticBody && !html.includes('id="static-seo-content"')) fail(`${route}: static readable body missing`);
  if (html.includes('%BASE_URL%')) fail(`${route}: unresolved Vite placeholder`);
};

for (const [route, entry] of Object.entries(PAGE_SEO)) await checkHtml(route, entry.label);
const teamIds = new Set(); const playerIds = new Set(); let checkedMatch = false;
for (const seasonId of SEASON_IDS) {
  const readJson = async (fileName) => JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));
  const articles = await readJson('news.json'); const teams = await readJson('teams.json'); const players = await readJson('players.json'); const matches = await readJson('matches.json');
  for (const article of articles) await checkHtml(`/news/${article.id}`, article.title);
  for (const team of teams) { const identity = team.identityId || team.id; if (teamIds.has(identity)) continue; teamIds.add(identity); await checkHtml(`/teams/${identity}`, team.name); }
  for (const player of players) { const identity = player.identityId || player.id; if (playerIds.has(identity)) continue; playerIds.add(identity); await checkHtml(`/players/${identity}`, player.name); }
  for (const match of matches.slice(0, 3)) { const home = teams.find((team) => team.id === match.homeTeamId); const away = teams.find((team) => team.id === match.awayTeamId); if (!home || !away) continue; await checkHtml(`/matches/${match.id}`, home.name); checkedMatch = true; }
}

const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes(`${SITE_URL}/news`)) fail('sitemap.xml: news route missing');
if (playerIds.size > 0 && !sitemap.includes(`${SITE_URL}/players/`)) fail('sitemap.xml: player routes missing');
if (teamIds.size > 0 && !sitemap.includes(`${SITE_URL}/teams/`)) fail('sitemap.xml: team routes missing');
if (checkedMatch && !sitemap.includes(`${SITE_URL}/matches/`)) fail('sitemap.xml: match routes missing');
if (!sitemap.includes(SITE_NAME.split('｜')[0]) && !sitemap.includes('<urlset')) fail('sitemap.xml: invalid document');
const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail('robots.txt: sitemap URL missing');
console.log('Static SEO validation passed');
