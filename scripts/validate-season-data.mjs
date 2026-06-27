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
const validDate = (value) => !Number.isNaN(new Date(value).getTime());
const validExternalUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};
const supportedSocialPlatforms = new Set(['instagram', 'facebook', 'youtube', 'website']);
const playerTeamAt = (player, timestamp) => {
  if (!player?.registrations?.length) return player?.teamId;
  const target = new Date(timestamp).getTime();
  const registration = player.registrations.find((item) => {
    const start = new Date(item.effectiveFrom).getTime();
    const end = item.effectiveTo ? new Date(item.effectiveTo).getTime() : Number.POSITIVE_INFINITY;
    return target >= start && target < end;
  });
  return registration?.teamId ?? player.teamId;
};

for (const season of seasons) {
  const teams = read(season, 'teams.json');
  const players = read(season, 'players.json');
  const images = read(season, 'playerImages.json');
  const matches = read(season, 'matches.json');
  const events = read(season, 'matchEvents.json');
  const decisions = read(season, 'disciplineDecisions.json');
  const lineups = read(season, 'lineups.json');
  const news = read(season, 'news.json');
  const media = read(season, 'media.json');
  const albums = read(season, 'albums.json');

  unique(teams, `${season} teams`);
  unique(players, `${season} players`);
  unique(matches, `${season} matches`);
  unique(decisions, `${season} discipline decisions`);
  unique(news, `${season} news`);
  unique(media, `${season} media`);
  unique(albums, `${season} albums`);

  const teamIds = new Set(teams.map((team) => team.id));
  const playerIds = new Set(players.map((player) => player.id));
  const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
  const matchIds = new Set(matches.map((match) => match.id));
  const matchMap = Object.fromEntries(matches.map((match) => [match.id, match]));

  for (const team of teams) {
    if (team.seasonId !== season) fail(`${season} team ${team.id}: invalid seasonId`);
    if (team.competitionStatus && !['ACTIVE', 'WITHDRAWN'].includes(team.competitionStatus)) {
      fail(`${season} team ${team.id}: invalid competitionStatus`);
    }
    if (team.socialLinks !== undefined) {
      if (!team.socialLinks || typeof team.socialLinks !== 'object' || Array.isArray(team.socialLinks)) {
        fail(`${season} team ${team.id}: socialLinks must be an object`);
      }
      for (const [platform, url] of Object.entries(team.socialLinks)) {
        if (!supportedSocialPlatforms.has(platform)) {
          fail(`${season} team ${team.id}: unsupported social platform ${platform}`);
        }
        if (!validExternalUrl(url)) {
          fail(`${season} team ${team.id}: invalid ${platform} URL`);
        }
      }
    }
    if (team.pointsAdjustment !== undefined && !Number.isInteger(team.pointsAdjustment)) {
      fail(`${season} team ${team.id}: pointsAdjustment must be an integer`);
    }
    if (team.manualTiebreakOrder !== undefined && (!Number.isInteger(team.manualTiebreakOrder) || team.manualTiebreakOrder < 1)) {
      fail(`${season} team ${team.id}: manualTiebreakOrder must be a positive integer`);
    }
    asset(team.logo, `${season} team ${team.id}`);
  }

  for (const player of players) {
    if (!teamIds.has(player.teamId)) fail(`${season} player ${player.id}: unknown team`);
    if (player.registrations) {
      for (const registration of player.registrations) {
        if (!teamIds.has(registration.teamId)) fail(`${season} player ${player.id}: unknown registration team`);
        if (!validDate(registration.effectiveFrom)) fail(`${season} player ${player.id}: invalid registration start`);
        if (registration.effectiveTo && !validDate(registration.effectiveTo)) fail(`${season} player ${player.id}: invalid registration end`);
      }
    }
  }

  for (const [name, path] of Object.entries(images)) asset(path, `${season} player image ${name}`);

  for (const match of matches) {
    if (!teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId)) fail(`${season} match ${match.id}: unknown team`);
    if (match.homeTeamId === match.awayTeamId) fail(`${season} match ${match.id}: team cannot play itself`);
    if (!validDate(match.timestamp)) fail(`${season} match ${match.id}: invalid date`);
    if (!['SCHEDULED', 'FINISHED'].includes(match.status)) fail(`${season} match ${match.id}: invalid status`);
    if (match.resultType && !['PLAYED', 'FORFEIT', 'DOUBLE_FORFEIT', 'VOID'].includes(match.resultType)) {
      fail(`${season} match ${match.id}: invalid resultType`);
    }
    if (match.status === 'SCHEDULED' && (match.homeScore !== null || match.awayScore !== null)) {
      fail(`${season} match ${match.id}: scheduled match must not have a score`);
    }
    if (match.status === 'FINISHED' && match.resultType !== 'DOUBLE_FORFEIT' && match.resultType !== 'VOID') {
      if (!Number.isInteger(match.homeScore) || !Number.isInteger(match.awayScore)) {
        fail(`${season} match ${match.id}: finished match requires integer scores`);
      }
    }
    if (match.resultType === 'DOUBLE_FORFEIT' && (match.homeScore !== null || match.awayScore !== null)) {
      fail(`${season} match ${match.id}: double forfeit must use null scores`);
    }
  }

  for (const [matchId, list] of Object.entries(events)) {
    if (!matchIds.has(matchId)) fail(`${season} events: unknown match ${matchId}`);
    unique(list, `${season} ${matchId} events`);
    const match = matchMap[matchId];
    const subjectEvents = new Map();

    for (const event of list) {
      if (!Number.isFinite(event.minute) || event.minute < 0 || event.minute > 120) {
        fail(`${season} ${matchId} event ${event.id}: invalid minute`);
      }
      if (!['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'].includes(event.type)) {
        fail(`${season} ${matchId} event ${event.id}: invalid type`);
      }
      if (!['HOME', 'AWAY'].includes(event.team)) fail(`${season} ${matchId} event ${event.id}: invalid team side`);
      if (!event.player?.trim()) fail(`${season} ${matchId} event ${event.id}: missing subject name`);

      const subjectType = event.subjectType ?? 'PLAYER';
      const subjectId = event.subjectId ?? event.playerId;
      const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
      if (season === '2026-27' && subjectType === 'PLAYER' && !subjectId) {
        fail(`${season} ${matchId} event ${event.id}: playerId is required`);
      }
      if (subjectType === 'PLAYER' && subjectId) {
        if (!playerIds.has(subjectId)) fail(`${season} ${matchId} event ${event.id}: unknown playerId`);
        const player = playerMap[subjectId];
        if (playerTeamAt(player, match.timestamp) !== eventTeamId) {
          fail(`${season} ${matchId} event ${event.id}: player is not registered to event team`);
        }
      }

      const key = subjectId ?? `${subjectType}:${eventTeamId}:${event.player}`;
      const item = subjectEvents.get(key) ?? { yellow: 0, secondYellow: 0, directRed: 0 };
      if (event.type === 'YELLOW_CARD') item.yellow += 1;
      if (event.type === 'SECOND_YELLOW') item.secondYellow += 1;
      if (event.type === 'RED_CARD') item.directRed += 1;
      subjectEvents.set(key, item);
    }

    if (season === '2026-27') {
      for (const [subjectId, item] of subjectEvents.entries()) {
        if (item.secondYellow > 1) fail(`${season} ${matchId} ${subjectId}: multiple second-yellow events`);
        if (item.secondYellow === 1 && item.yellow < 1) {
          fail(`${season} ${matchId} ${subjectId}: second yellow requires an earlier yellow event`);
        }
        if (item.yellow > 1 && item.secondYellow === 0) {
          fail(`${season} ${matchId} ${subjectId}: multiple yellow cards require SECOND_YELLOW`);
        }
      }

      if (match.status === 'FINISHED' && (match.resultType ?? 'PLAYED') === 'PLAYED') {
        const homeGoals = list.filter((event) => event.type === 'GOAL' && event.team === 'HOME').length;
        const awayGoals = list.filter((event) => event.type === 'GOAL' && event.team === 'AWAY').length;
        if (homeGoals !== match.homeScore || awayGoals !== match.awayScore) {
          fail(`${season} match ${matchId}: score does not match goal events`);
        }
      }
    }
  }

  for (const [matchId, lineup] of Object.entries(lineups)) {
    if (!matchIds.has(matchId)) fail(`${season} lineups: unknown match ${matchId}`);
    const match = matchMap[matchId];
    for (const [side, ids] of [['HOME', lineup.homePlayerIds], ['AWAY', lineup.awayPlayerIds]]) {
      if (!Array.isArray(ids)) fail(`${season} lineup ${matchId}: ${side} player list is invalid`);
      if (new Set(ids).size !== ids.length) fail(`${season} lineup ${matchId}: duplicate ${side} player`);
      const teamId = side === 'HOME' ? match.homeTeamId : match.awayTeamId;
      for (const playerId of ids) {
        if (!playerIds.has(playerId)) fail(`${season} lineup ${matchId}: unknown player ${playerId}`);
        if (playerTeamAt(playerMap[playerId], match.timestamp) !== teamId) {
          fail(`${season} lineup ${matchId}: player ${playerId} is not registered to ${side} team`);
        }
      }
    }
  }

  for (const decision of decisions) {
    if (!['PLAYER', 'STAFF'].includes(decision.subjectType)) fail(`${season} decision ${decision.id}: invalid subjectType`);
    if (!teamIds.has(decision.teamId)) fail(`${season} decision ${decision.id}: unknown team`);
    if (decision.subjectType === 'PLAYER' && !playerIds.has(decision.subjectId)) {
      fail(`${season} decision ${decision.id}: unknown player`);
    }
    if (decision.sourceMatchId && !matchIds.has(decision.sourceMatchId)) {
      fail(`${season} decision ${decision.id}: unknown source match`);
    }
    if (!validDate(decision.issuedAt)) fail(`${season} decision ${decision.id}: invalid issuedAt`);
    if (!Number.isInteger(decision.additionalSuspensionMatches) || decision.additionalSuspensionMatches < 1) {
      fail(`${season} decision ${decision.id}: suspension matches must be a positive integer`);
    }
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

for (const file of [
  'teams.json',
  'players.json',
  'playerImages.json',
  'matches.json',
  'matchEvents.json',
  'disciplineDecisions.json',
  'lineups.json',
  'media.json',
  'albums.json',
]) {
  const value = read('2026-27', file);
  const count = Array.isArray(value) ? value.length : Object.keys(value).length;
  if (count !== 0) fail(`2026-27 ${file}: must stay empty until official data is confirmed`);
}

const registrationNews = read('2026-27', 'news.json');
if (registrationNews.length !== 1 || registrationNews[0].id !== '2026-27-registration-open') {
  fail('2026-27: registration announcement is missing or duplicated');
}

console.log('Season data validation passed');
