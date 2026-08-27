import fs from 'node:fs/promises';
import path from 'node:path';
import { SEASON_IDS, SITE_URL } from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const fail = (message) => { throw new Error(message); };
const routeFile = (route) => route === '/'
  ? path.join(distDir, 'index.html')
  : path.join(distDir, route.replace(/^\//, ''), 'index.html');
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));
const readRoute = (route) => fs.readFile(routeFile(route), 'utf8');
const teamIdentity = (team) => team.identityId ?? team.id;
const playerIdentity = (player) => player.identityId ?? player.id;

const resolveEventPlayer = (payload, match, event) => {
  const explicitId = event.playerId ?? event.subjectId;
  if (explicitId) return payload.players.find((player) => player.id === explicitId);
  const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
  const candidates = payload.players.filter((player) => player.name === event.player);
  return candidates.find((player) => player.teamId === eventTeamId) ??
    (candidates.length === 1 ? candidates[0] : undefined);
};

let fixture = null;
for (const seasonId of SEASON_IDS) {
  const payload = {
    teams: await readJson(seasonId, 'teams.json'),
    players: await readJson(seasonId, 'players.json'),
    matches: await readJson(seasonId, 'matches.json'),
    events: await readJson(seasonId, 'matchEvents.json'),
  };

  for (const match of payload.matches) {
    const event = (payload.events[match.id] ?? []).find((candidate) =>
      resolveEventPlayer(payload, match, candidate),
    );
    if (!event) continue;
    const player = resolveEventPlayer(payload, match, event);
    const home = payload.teams.find((team) => team.id === match.homeTeamId);
    const away = payload.teams.find((team) => team.id === match.awayTeamId);
    if (!player || !home || !away) continue;
    fixture = { seasonId, payload, match, event, player, home, away };
    break;
  }
  if (fixture) break;
}

if (!fixture) fail('No resolvable match-event fixture found for static data SEO validation');

const { seasonId, match, player, home, away } = fixture;
const matchRoute = `/matches/${match.id}`;
const playerRoute = `/players/${playerIdentity(player)}`;
const teamRoute = `/teams/${teamIdentity(home)}`;
const roundRoute = `/rounds/${seasonId}/${match.league}/${encodeURIComponent(String(match.round))}`;

const scheduleHtml = await readRoute('/schedule');
if (scheduleHtml.includes(`${SITE_URL}${matchRoute}`)) {
  fail(`/schedule: match permalink must not be duplicated into the static schedule body (${matchRoute})`);
}
if (!scheduleHtml.includes(`${SITE_URL}${roundRoute}`)) {
  fail(`/schedule: round entity link missing (${roundRoute})`);
}
if (!scheduleHtml.includes(home.name) || !scheduleHtml.includes(away.name)) {
  fail('/schedule: match facts missing from static body');
}
if (!scheduleHtml.includes('id="static-seo-content"')) {
  fail('/schedule: crawler-readable static body missing');
}

const standingsHtml = await readRoute('/standings');
if (!standingsHtml.includes(`${SITE_URL}${teamRoute}`) || !standingsHtml.includes(home.name)) {
  fail(`/standings: team entity data missing (${home.name})`);
}
if (!standingsHtml.includes('積分') || !standingsHtml.includes('得失球')) {
  fail('/standings: standings facts missing from static body');
}

const statsHtml = await readRoute('/stats');
if (!statsHtml.includes(`${SITE_URL}${playerRoute}`) || !statsHtml.includes(player.name)) {
  fail(`/stats: player entity data missing (${player.name})`);
}
if (!statsHtml.includes('進球') || !statsHtml.includes('黃牌')) {
  fail('/stats: player statistics missing from static body');
}

const playerHtml = await readRoute(playerRoute);
if (playerHtml.includes(`${SITE_URL}${matchRoute}`)) {
  fail(`${playerRoute}: match permalink must not be injected into static player history`);
}
if (!playerHtml.includes('歷年賽季') || !playerHtml.includes('個人比賽事件')) {
  fail(`${playerRoute}: player history sections missing`);
}
if (playerHtml.includes('雙黃')) {
  fail(`${playerRoute}: player static data must use combined red-card display`);
}

const matchHtml = await readRoute(matchRoute);
if (!matchHtml.includes(`<link rel="canonical" href="${SITE_URL}${matchRoute}"`)) {
  fail(`${matchRoute}: canonical must point to the permanent match URL`);
}
if (matchHtml.includes('name="robots" content="noindex,follow"')) {
  fail(`${matchRoute}: permanent match URL must be indexable`);
}
if (!matchHtml.includes('SportsEvent')) {
  fail(`${matchRoute}: SportsEvent structured data missing`);
}
if (!matchHtml.includes(home.name) || !matchHtml.includes(away.name)) {
  fail(`${matchRoute}: social metadata must contain both team names`);
}
if (!matchHtml.includes(`property="og:url" content="${SITE_URL}${matchRoute}"`)) {
  fail(`${matchRoute}: Open Graph URL must use the permanent match URL`);
}
if (!matchHtml.includes('name="twitter:card" content="summary_large_image"')) {
  fail(`${matchRoute}: Twitter/X large image card metadata missing`);
}

const roundHtml = await readRoute(roundRoute);
if (roundHtml.includes(`${SITE_URL}${matchRoute}`)) {
  fail(`${roundRoute}: match permalink must not be injected into static round body`);
}
if (!roundHtml.includes('本輪數據') || !roundHtml.includes('本輪總進球')) {
  fail(`${roundRoute}: round data facts missing`);
}
if (roundHtml.includes('數據洞察')) {
  fail(`${roundRoute}: legacy insight wording remains`);
}

const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes(`<loc>${SITE_URL}${matchRoute}</loc>`)) {
  fail(`sitemap.xml: permanent match route must be indexed (${matchRoute})`);
}

console.log(
  `Static data SEO validation passed using ${seasonId} ${match.league} round ${match.round}, match ${match.id}, player ${player.name}`,
);
