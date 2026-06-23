import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const seasons = ['2025-26', '2026-27'];
const root = process.cwd();
const read = (season, file) => JSON.parse(readFileSync(join(root, 'data', 'seasons', season, file), 'utf8'));
const fail = (message) => { throw new Error(message); };
const unique = (items, label) => {
  const ids = new Set();
  for (const item of items) {
    if (!item.id || ids.has(item.id)) fail(`${label}: missing or duplicate id ${item.id ?? ''}`);
    ids.add(item.id);
  }
};
const asset = (value, label) => {
  if (!value || /^https?:\/\//.test(value)) return;
  if (value.startsWith('/') || value.startsWith('d-league/')) fail(`${label}: invalid asset path ${value}`);
};

for (const season of seasons) {
  const teams = read(season, 'teams.json');
  const players = read(season, 'players.json');
  const images = read(season, 'playerImages.json');
  const matches = read(season, 'matches.json');
  const events = read(season, 'matchEvents.json');
  const news = read(season, 'news.json');
  const media = read(season, 'media.json');
  const albums = read(season, 'albums.json');

  unique(teams, `${season} teams`);
  unique(players, `${season} players`);
  unique(matches, `${season} matches`);
  unique(news, `${season} news`);
  unique(media, `${season} media`);
  unique(albums, `${season} albums`);

  const teamIds = new Set(teams.map((team) => team.id));
  const matchIds = new Set(matches.map((match) => match.id));

  for (const team of teams) {
    if (team.seasonId !== season) fail(`${season} team ${team.id}: invalid seasonId`);
    asset(team.logo, `${season} team ${team.id}`);
  }
  for (const player of players) {
    if (!teamIds.has(player.teamId)) fail(`${season} player ${player.id}: unknown team`);
  }
  for (const [name, path] of Object.entries(images)) asset(path, `${season} player image ${name}`);
  for (const match of matches) {
    if (!teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId)) fail(`${season} match ${match.id}: unknown team`);
    if (Number.isNaN(new Date(match.timestamp).getTime())) fail(`${season} match ${match.id}: invalid date`);
  }
  for (const [matchId, list] of Object.entries(events)) {
    if (!matchIds.has(matchId)) fail(`${season} events: unknown match ${matchId}`);
    unique(list, `${season} ${matchId} events`);
  }
  for (const article of news) {
    if (article.seasonId && article.seasonId !== season) fail(`${season} news ${article.id}: invalid seasonId`);
    asset(article.imageUrl, `${season} news ${article.id}`);
  }
  for (const item of media) asset(item.thumbnail, `${season} media ${item.id}`);
  for (const album of albums) asset(album.cover, `${season} album ${album.id}`);

  console.log(`${season}: ${teams.length} teams, ${players.length} players, ${matches.length} matches, ${news.length} news`);
}

if (read('2025-26', 'teams.json').length !== 10) fail('2025-26: expected 10 teams');
if (read('2025-26', 'players.json').length !== 191) fail('2025-26: expected 191 players');
if (read('2025-26', 'matches.json').length !== 48) fail('2025-26: expected 48 matches');
if (Object.keys(read('2025-26', 'matchEvents.json')).length !== 48) fail('2025-26: expected events for 48 matches');
if (read('2025-26', 'news.json').length !== 66) fail('2025-26: expected 66 news articles');

for (const file of ['teams.json', 'players.json', 'playerImages.json', 'matches.json', 'matchEvents.json', 'media.json', 'albums.json']) {
  const value = read('2026-27', file);
  const count = Array.isArray(value) ? value.length : Object.keys(value).length;
  if (count !== 0) fail(`2026-27 ${file}: must stay empty until official data is confirmed`);
}

const registrationNews = read('2026-27', 'news.json');
if (registrationNews.length !== 1 || registrationNews[0].id !== '2026-27-registration-open') {
  fail('2026-27: registration announcement is missing or duplicated');
}

console.log('Season data validation passed');
