import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SEASON_IDS,
  SITE_URL,
  getSeasonDisplayName,
} from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routeUrl = (route) => `${SITE_URL}${route === '/' ? '/' : route}`;
const routeFile = (route) =>
  route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.replace(/^\//, ''), 'index.html');
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));

const payloads = {};
for (const seasonId of SEASON_IDS) {
  payloads[seasonId] = {
    teams: await readJson(seasonId, 'teams.json'),
    players: await readJson(seasonId, 'players.json'),
    matches: await readJson(seasonId, 'matches.json'),
    events: await readJson(seasonId, 'matchEvents.json'),
  };
}

const staticShell = (title, subtitle, body) => `
  <main id="static-seo-content" style="max-width:1040px;margin:0 auto;padding:48px 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <p style="font-size:12px;font-weight:700;color:#6b7280;margin:0 0 8px">D LEAGUE 官方資料</p>
    <h1 style="font-size:32px;line-height:1.15;margin:0 0 12px">${escapeHtml(title)}</h1>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px">${escapeHtml(subtitle)}</p>
    ${body}
  </main>`;

const replaceStaticBody = (html, staticContent) => {
  const withoutBody = html.replace(/\s*<main id="static-seo-content"[\s\S]*?<\/main>/g, '');
  return withoutBody.replace('<div id="root"></div>', `${staticContent}\n    <div id="root"></div>`);
};

const upsertMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

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

const getPlayerStats = (payload, playerId) => {
  const result = {
    goals: 0,
    yellowCards: 0,
    secondYellowDismissals: 0,
    directRedCards: 0,
    eventMatches: new Set(),
    events: [],
  };

  payload.matches.forEach((match) => {
    const ownEvents = (payload.events[match.id] ?? []).filter(
      (event) => resolveEventPlayer(payload, match, event)?.id === playerId,
    );
    if (ownEvents.length === 0) return;
    result.eventMatches.add(match.id);
    ownEvents.forEach((event) => {
      if (
        event.type === 'GOAL' &&
        !event.isOwnGoal &&
        match.resultType !== 'VOID' &&
        match.countsForPlayerStats !== false
      ) result.goals += 1;
      if (event.type === 'YELLOW_CARD') result.yellowCards += 1;
      if (event.type === 'SECOND_YELLOW') {
        result.yellowCards += 1;
        result.secondYellowDismissals += 1;
      }
      if (event.type === 'RED_CARD') result.directRedCards += 1;
      result.events.push({ match, event });
    });
  });

  return result;
};

const aggregateLeagueStats = (payload, league) => {
  const rows = payload.players
    .filter((player) => payload.teams.find((team) => team.id === player.teamId)?.leagueId === league)
    .map((player) => ({ player, stats: getPlayerStats(payload, player.id) }))
    .filter(({ stats }) =>
      stats.goals > 0 ||
      stats.yellowCards > 0 ||
      stats.secondYellowDismissals > 0 ||
      stats.directRedCards > 0
    );

  return rows.sort(
    (a, b) =>
      b.stats.goals - a.stats.goals ||
      b.stats.directRedCards - a.stats.directRedCards ||
      b.stats.secondYellowDismissals - a.stats.secondYellowDismissals ||
      b.stats.yellowCards - a.stats.yellowCards ||
      a.player.name.localeCompare(b.player.name, 'zh-TW'),
  );
};

const statsBody = [...SEASON_IDS].reverse().map((seasonId) => {
  const payload = payloads[seasonId];
  const leagues = [...new Set(payload.teams.map((team) => team.leagueId))];
  if (leagues.length === 0) {
    return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2><p>球員數據尚未公布。</p></section>`;
  }
  return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2>${leagues.map((league) => {
    const rows = aggregateLeagueStats(payload, league);
    if (rows.length === 0) return `<section><h3>${escapeHtml(league)}</h3><p>目前尚無進球或牌卡事件。</p></section>`;
    return `<section><h3>${escapeHtml(league)} 球員數據</h3><ol>${rows.map(({ player, stats }) => {
      const team = payload.teams.find((candidate) => candidate.id === player.teamId);
      const teamText = team
        ? `<a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(team)}`))}">${escapeHtml(team.name)}</a>`
        : '未指定球隊';
      return `<li><a href="${escapeHtml(routeUrl(`/players/${playerIdentity(player)}`))}">${escapeHtml(player.name)}</a> — ${teamText}；進球 ${stats.goals}、黃牌 ${stats.yellowCards}、雙黃 ${stats.secondYellowDismissals}、紅牌 ${stats.directRedCards}</li>`;
    }).join('')}</ol></section>`;
  }).join('')}</section>`;
}).join('');

{
  const file = routeFile('/stats');
  const html = await fs.readFile(file, 'utf8');
  await fs.writeFile(
    file,
    replaceStaticBody(
      html,
      staticShell(
        'D LEAGUE 球員數據',
        'D LEAGUE 歷年射手、進球、紅黃牌與球員官方資料',
        statsBody,
      ),
    ),
  );
}

const playerGroups = new Map();
for (const seasonId of SEASON_IDS) {
  const payload = payloads[seasonId];
  payload.players.forEach((player) => {
    const identity = playerIdentity(player);
    const group = playerGroups.get(identity) ?? [];
    group.push({
      seasonId,
      payload,
      player,
      team: payload.teams.find((team) => team.id === player.teamId),
    });
    playerGroups.set(identity, group);
  });
}

for (const [identity, recordsInput] of playerGroups) {
  const records = recordsInput.slice().sort((a, b) => b.seasonId.localeCompare(a.seasonId));
  const latest = records[0];
  const totals = records.reduce(
    (acc, record) => {
      const stats = getPlayerStats(record.payload, record.player.id);
      acc.goals += stats.goals;
      acc.yellowCards += stats.yellowCards;
      acc.secondYellowDismissals += stats.secondYellowDismissals;
      acc.directRedCards += stats.directRedCards;
      acc.eventMatches += stats.eventMatches.size;
      return acc;
    },
    { goals: 0, yellowCards: 0, secondYellowDismissals: 0, directRedCards: 0, eventMatches: 0 },
  );
  const description = `${latest.player.name} D LEAGUE 官方球員頁，包含歷年效力球隊、賽季紀錄、進球 ${totals.goals} 球、黃牌 ${totals.yellowCards} 張及比賽事件`;

  const historyItems = records.map((record) => {
    const stats = getPlayerStats(record.payload, record.player.id);
    const teamText = record.team
      ? `<a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(record.team)}`))}">${escapeHtml(record.team.name)}</a>`
      : '未指定球隊';
    return `<li>${escapeHtml(getSeasonDisplayName(record.seasonId))}：${teamText}；進球 ${stats.goals}、黃牌 ${stats.yellowCards}、雙黃 ${stats.secondYellowDismissals}、紅牌 ${stats.directRedCards}</li>`;
  }).join('');

  const eventItems = records.flatMap((record) => {
    const stats = getPlayerStats(record.payload, record.player.id);
    return stats.events.map(({ match, event }) => ({
      timestamp: match.timestamp,
      html: `<li><a href="${escapeHtml(routeUrl(`/matches/${match.id}`))}">${escapeHtml(
        `${match.timestamp?.slice(0, 10)} ${event.minute}' ${event.type}`,
      )}</a></li>`,
    }));
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const body = `
    <p>歷年有事件紀錄的比賽 ${totals.eventMatches} 場；進球 ${totals.goals}；黃牌 ${totals.yellowCards}；雙黃 ${totals.secondYellowDismissals}；紅牌 ${totals.directRedCards}。</p>
    <h2>歷年賽季</h2><ul>${historyItems}</ul>
    <h2>個人比賽事件</h2>${eventItems.length ? `<ul>${eventItems.slice(0, 30).map((item) => item.html).join('')}</ul>` : '<p>目前沒有可連結的個人比賽事件。</p>'}`;

  const routeIds = new Set([identity, ...records.map((record) => record.player.id)]);
  for (const routeId of routeIds) {
    const file = routeFile(`/players/${routeId}`);
    let html = await fs.readFile(file, 'utf8');
    html = upsertMeta(html, 'name', 'description', description);
    html = upsertMeta(html, 'property', 'og:description', description);
    html = upsertMeta(html, 'name', 'twitter:description', description);
    html = replaceStaticBody(html, staticShell(latest.player.name, description, body));
    await fs.writeFile(file, html);
  }
}

const getRoundSummary = (payload, league, round) => {
  const matches = payload.matches.filter(
    (match) => match.league === league && String(match.round) === String(round),
  );
  const completed = matches.filter(
    (match) => match.homeScore !== null && match.awayScore !== null,
  );
  const totalGoals = completed.reduce(
    (sum, match) => sum + match.homeScore + match.awayScore,
    0,
  );
  const biggestMargin = completed.reduce(
    (max, match) => Math.max(max, Math.abs(match.homeScore - match.awayScore)),
    0,
  );
  const scorerMap = new Map();

  completed.forEach((match) => {
    (payload.events[match.id] ?? []).forEach((event) => {
      if (event.type !== 'GOAL' || event.isOwnGoal) return;
      const player = resolveEventPlayer(payload, match, event);
      const key = player?.id ?? event.player;
      const row = scorerMap.get(key) ?? {
        player,
        name: player?.name ?? event.player,
        goals: 0,
      };
      row.goals += 1;
      scorerMap.set(key, row);
    });
  });

  const topScorer = [...scorerMap.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'zh-TW'),
  )[0];
  return { matches, completed, totalGoals, biggestMargin, topScorer };
};

for (const seasonId of SEASON_IDS) {
  const payload = payloads[seasonId];
  const teamMap = new Map(payload.teams.map((team) => [team.id, team]));
  const roundKeys = new Set(payload.matches.map((match) => `${match.league}|${match.round}`));

  for (const key of roundKeys) {
    const [league, round] = key.split('|');
    const summary = getRoundSummary(payload, league, round);
    const route = `/rounds/${seasonId}/${league}/${encodeURIComponent(round)}`;
    const file = routeFile(route);
    let html = await fs.readFile(file, 'utf8');

    const scorerText = summary.topScorer
      ? summary.topScorer.player
        ? `<a href="${escapeHtml(routeUrl(`/players/${playerIdentity(summary.topScorer.player)}`))}">${escapeHtml(summary.topScorer.name)}</a>，${summary.topScorer.goals} 球`
        : `${escapeHtml(summary.topScorer.name)}，${summary.topScorer.goals} 球`
      : '目前尚無進球資料';

    const matchItems = summary.matches
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((match) => {
        const home = teamMap.get(match.homeTeamId);
        const away = teamMap.get(match.awayTeamId);
        if (!home || !away) return '';
        const score =
          match.homeScore !== null && match.awayScore !== null
            ? `${match.homeScore}–${match.awayScore}`
            : 'vs';
        return `<li><a href="${escapeHtml(routeUrl(`/matches/${match.id}`))}">${escapeHtml(
          `${match.timestamp?.slice(0, 10)} ${home.name} ${score} ${away.name}`,
        )}</a></li>`;
      }).join('');

    const body = `
      <h2>本輪數據洞察</h2>
      <ul>
        <li>已完成比賽：${summary.completed.length}</li>
        <li>本輪總進球：${summary.totalGoals}</li>
        <li>場均進球：${summary.completed.length ? (summary.totalGoals / summary.completed.length).toFixed(1) : '0.0'}</li>
        <li>最大勝差：${summary.biggestMargin}</li>
        <li>本輪目前進球最多：${scorerText}</li>
      </ul>
      <h2>本輪賽程與賽果</h2><ul>${matchItems}</ul>`;

    html = replaceStaticBody(
      html,
      staticShell(
        `${getSeasonDisplayName(seasonId)} ${league} 第 ${round} 輪`,
        `${getSeasonDisplayName(seasonId)} ${league} 第 ${round} 輪官方賽程、賽果與數據洞察`,
        body,
      ),
    );
    await fs.writeFile(file, html);
  }

  for (const match of payload.matches) {
    const home = teamMap.get(match.homeTeamId);
    const away = teamMap.get(match.awayTeamId);
    if (!home || !away) continue;
    const summary = getRoundSummary(payload, match.league, match.round);
    const score =
      match.homeScore !== null && match.awayScore !== null
        ? `${match.homeScore}–${match.awayScore}`
        : 'vs';
    const roundRoute = `/rounds/${seasonId}/${match.league}/${encodeURIComponent(String(match.round))}`;

    const eventItems = (payload.events[match.id] ?? []).map((event) => {
      const player = resolveEventPlayer(payload, match, event);
      const playerText = player
        ? `<a href="${escapeHtml(routeUrl(`/players/${playerIdentity(player)}`))}">${escapeHtml(player.name)}</a>`
        : escapeHtml(event.player);
      return `<li>${escapeHtml(event.minute)}' ${playerText} — ${escapeHtml(event.type)}</li>`;
    }).join('');

    const scorerText = summary.topScorer
      ? summary.topScorer.player
        ? `<a href="${escapeHtml(routeUrl(`/players/${playerIdentity(summary.topScorer.player)}`))}">${escapeHtml(summary.topScorer.name)}</a> ${summary.topScorer.goals} 球`
        : `${escapeHtml(summary.topScorer.name)} ${summary.topScorer.goals} 球`
      : '尚無進球資料';

    const body = `
      <p>${escapeHtml(match.timestamp)} · ${escapeHtml(match.venue)}</p>
      <p><a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(home)}`))}">${escapeHtml(home.name)}</a> ${escapeHtml(score)} <a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(away)}`))}">${escapeHtml(away.name)}</a></p>
      <h2><a href="${escapeHtml(routeUrl(roundRoute))}">第 ${escapeHtml(match.round)} 輪數據洞察</a></h2>
      <ul>
        <li>已完成比賽：${summary.completed.length}</li>
        <li>本輪總進球：${summary.totalGoals}</li>
        <li>場均進球：${summary.completed.length ? (summary.totalGoals / summary.completed.length).toFixed(1) : '0.0'}</li>
        <li>最大勝差：${summary.biggestMargin}</li>
        <li>本輪目前進球最多：${scorerText}</li>
      </ul>
      <h2>比賽事件</h2>${eventItems ? `<ul>${eventItems}</ul>` : '<p>目前沒有已登錄的比賽事件。</p>'}`;

    const file = routeFile(`/matches/${match.id}`);
    const html = await fs.readFile(file, 'utf8');
    await fs.writeFile(
      file,
      replaceStaticBody(
        html,
        staticShell(
          `${home.name} ${score} ${away.name}`,
          `${getSeasonDisplayName(seasonId)} ${match.league} 第 ${match.round} 輪官方比賽紀錄`,
          body,
        ),
      ),
    );
  }
}

console.log('Legacy event entity enrichment complete');
