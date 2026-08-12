import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  PAGE_SEO,
  SEASON_IDS,
  SITE_NAME,
  SITE_SOCIAL_URLS,
  SITE_URL,
  getSeasonDisplayName,
} from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const templatePath = path.join(distDir, 'index.html');
const template = await fs.readFile(templatePath, 'utf8');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const absoluteAssetUrl = (value) => {
  const asset = value || DEFAULT_SOCIAL_IMAGE;
  if (/^https?:\/\//.test(asset)) return asset;
  return `${SITE_URL}/${String(asset).replace(/^\/+/, '').replace(/^d-league\//, '')}`;
};
const routeUrl = (route) => `${SITE_URL}${route === '/' ? '/' : route}`;
const safeEntityId = (value, label) => {
  if (!value || String(value).includes('/')) throw new Error(`Invalid ${label} route id: ${value}`);
  return String(value);
};
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));

const seasonPayloads = {};
for (const seasonId of SEASON_IDS) {
  seasonPayloads[seasonId] = {
    teams: await readJson(seasonId, 'teams.json'),
    players: await readJson(seasonId, 'players.json'),
    playerImages: await readJson(seasonId, 'playerImages.json'),
    matches: await readJson(seasonId, 'matches.json'),
    events: await readJson(seasonId, 'matchEvents.json'),
    news: await readJson(seasonId, 'news.json'),
  };
}

const organizationReference = {
  '@type': 'SportsOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  sport: 'Association Football',
};
const organizationSchema = {
  '@context': 'https://schema.org',
  ...organizationReference,
  sameAs: SITE_SOCIAL_URLS,
};
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'zh-Hant',
};

const upsertMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const staticShell = (title, subtitle, body = '') => `
  <main id="static-seo-content" style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <p style="font-size:12px;font-weight:700;color:#6b7280;margin:0 0 8px">D LEAGUE 官方資料</p>
    <h1 style="font-size:32px;line-height:1.15;margin:0 0 12px">${escapeHtml(title)}</h1>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px">${escapeHtml(subtitle)}</p>
    ${body}
  </main>`;

const renderHtml = ({
  route,
  canonicalRoute = route,
  title,
  description,
  image,
  type = 'website',
  schemas = [],
  staticContent = '',
}) => {
  const canonical = routeUrl(canonicalRoute);
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'property', 'og:type', type);
  html = upsertMeta(html, 'property', 'og:site_name', SITE_NAME);
  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:image', image);

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const canonicalPattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace('</head>', `    ${canonicalTag}\n  </head>`);

  html = html.replace(/\s*<script type="application\/ld\+json" data-static-seo>[\s\S]*?<\/script>/g, '');
  const schemaTags = schemas.map((schema) => {
    const json = JSON.stringify(schema).replaceAll('<', '\\u003c');
    return `    <script type="application/ld+json" data-static-seo>${json}</script>`;
  }).join('\n');
  html = html.replace('</head>', `${schemaTags ? `${schemaTags}\n` : ''}  </head>`);

  html = html.replace(/\s*<main id="static-seo-content"[\s\S]*?<\/main>/g, '');
  if (staticContent) html = html.replace('<div id="root"></div>', `${staticContent}\n    <div id="root"></div>`);
  return html;
};

const writeRoute = async (route, html) => {
  const outputPath = route === '/'
    ? templatePath
    : path.join(distDir, route.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
};

const sitemapEntries = new Map();
const addSitemapEntry = (route, lastmod) => {
  sitemapEntries.set(route, { url: routeUrl(route), lastmod });
};

const playerStats = (payload, playerId) => {
  let goals = 0;
  let yellowCards = 0;
  let secondYellowDismissals = 0;
  let directRedCards = 0;
  const eventMatchIds = new Set();
  Object.entries(payload.events).forEach(([matchId, events]) => {
    events.forEach((event) => {
      if ((event.playerId ?? event.subjectId) !== playerId) return;
      eventMatchIds.add(matchId);
      if (event.type === 'GOAL' && !event.isOwnGoal) goals += 1;
      if (event.type === 'YELLOW_CARD') yellowCards += 1;
      if (event.type === 'SECOND_YELLOW') {
        yellowCards += 1;
        secondYellowDismissals += 1;
      }
      if (event.type === 'RED_CARD') directRedCards += 1;
    });
  });
  return {
    goals,
    yellowCards,
    secondYellowDismissals,
    directRedCards,
    eventMatches: eventMatchIds.size,
  };
};

const getRoundInsights = (payload, targetMatch) => {
  const matches = payload.matches.filter(
    (match) =>
      match.league === targetMatch.league &&
      String(match.round) === String(targetMatch.round) &&
      (match.status === 'FINISHED' || (match.homeScore !== null && match.awayScore !== null)) &&
      match.homeScore !== null &&
      match.awayScore !== null,
  );
  const totalGoals = matches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);
  const biggestMargin = matches.reduce(
    (max, match) => Math.max(max, Math.abs(match.homeScore - match.awayScore)),
    0,
  );
  const scorerMap = new Map();
  matches.forEach((match) => {
    (payload.events[match.id] ?? []).forEach((event) => {
      if (event.type !== 'GOAL' || event.isOwnGoal) return;
      const key = event.playerId ?? event.subjectId ?? event.player;
      const current = scorerMap.get(key) ?? {
        playerId: event.playerId ?? event.subjectId,
        name: event.player,
        goals: 0,
      };
      current.goals += 1;
      scorerMap.set(key, current);
    });
  });
  const topScorer = [...scorerMap.values()].sort(
    (a, b) => b.goals - a.goals || String(a.name).localeCompare(String(b.name), 'zh-TW'),
  )[0];
  return {
    completedMatches: matches.length,
    totalGoals,
    averageGoals: matches.length ? totalGoals / matches.length : 0,
    biggestMargin,
    topScorer,
  };
};

for (const [route, entry] of Object.entries(PAGE_SEO)) {
  const title = `${entry.label}｜${SITE_NAME}`;
  await writeRoute(route, renderHtml({
    route,
    title,
    description: entry.description,
    image: absoluteAssetUrl(DEFAULT_SOCIAL_IMAGE),
    schemas: route === '/' ? [organizationSchema, websiteSchema] : [organizationSchema],
    staticContent: staticShell(entry.label, entry.description),
  }));
  addSitemapEntry(route);
}

for (const seasonId of SEASON_IDS) {
  for (const article of seasonPayloads[seasonId].news) {
    safeEntityId(article.id, 'news');
    const route = `/news/${article.id}`;
    const seasonDisplayName = getSeasonDisplayName(seasonId);
    const title = `${article.title}｜${seasonDisplayName}｜${SITE_NAME}`;
    const description = article.summary || DEFAULT_DESCRIPTION;
    const image = absoluteAssetUrl(article.imageUrl);
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description,
      image: [image],
      datePublished: article.timestamp,
      dateModified: article.timestamp,
      inLanguage: 'zh-Hant',
      mainEntityOfPage: routeUrl(route),
      author: organizationReference,
      publisher: organizationReference,
    };
    await writeRoute(route, renderHtml({
      route,
      title,
      description,
      image,
      type: 'article',
      schemas: [schema],
      staticContent: staticShell(article.title, description),
    }));
    addSitemapEntry(route, article.timestamp?.slice(0, 10));
  }
}

const teamGroups = new Map();
for (const seasonId of SEASON_IDS) {
  const payload = seasonPayloads[seasonId];
  for (const team of payload.teams) {
    const identity = safeEntityId(team.identityId ?? team.id, 'team');
    const group = teamGroups.get(identity) ?? [];
    group.push({ seasonId, team, payload });
    teamGroups.set(identity, group);
  }
}

for (const [identity, recordsInput] of teamGroups) {
  const records = recordsInput.slice().sort((a, b) => b.seasonId.localeCompare(a.seasonId));
  const latest = records[0];
  const canonicalRoute = `/teams/${identity}`;
  const title = `${latest.team.name}｜D LEAGUE 官方球隊資料｜${SITE_NAME}`;
  const description = `${latest.team.name} D LEAGUE 官方球隊頁，提供歷年參賽賽季、球員名單、賽程、賽果、排名與球隊數據`;
  const image = absoluteAssetUrl(latest.team.logo);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: latest.team.name,
    alternateName: latest.team.shortName,
    sport: 'Association Football',
    url: routeUrl(canonicalRoute),
    logo: image,
    memberOf: organizationReference,
  };

  const seasonBody = records.map(({ seasonId, team, payload }) => {
    const players = payload.players
      .filter((player) => player.teamId === team.id)
      .sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
    const matches = payload.matches.filter(
      (match) => match.homeTeamId === team.id || match.awayTeamId === team.id,
    );
    const roster = players.length
      ? `<ul>${players.map((player) => {
          const playerIdentity = safeEntityId(player.identityId ?? player.id, 'player');
          return `<li><a href="${escapeHtml(routeUrl(`/players/${playerIdentity}`))}">#${escapeHtml(player.number)} ${escapeHtml(player.name)}</a></li>`;
        }).join('')}</ul>`
      : '<p>球員名單尚未公布。</p>';
    return `<section>
      <h2>${escapeHtml(getSeasonDisplayName(seasonId))} · ${escapeHtml(team.leagueId)}</h2>
      <p>正式賽事資料 ${matches.length} 場；登錄球員 ${players.length} 人。</p>
      ${roster}
    </section>`;
  }).join('');

  const staticContent = staticShell(latest.team.name, description, seasonBody);
  const routeIds = new Set([identity, ...records.map(({ team }) => safeEntityId(team.id, 'team'))]);
  for (const routeId of routeIds) {
    const route = `/teams/${routeId}`;
    await writeRoute(route, renderHtml({
      route,
      canonicalRoute,
      title,
      description,
      image,
      schemas: [schema],
      staticContent,
    }));
  }
  addSitemapEntry(canonicalRoute);
}

const playerGroups = new Map();
for (const seasonId of SEASON_IDS) {
  const payload = seasonPayloads[seasonId];
  for (const player of payload.players) {
    const identity = safeEntityId(player.identityId ?? player.id, 'player');
    const group = playerGroups.get(identity) ?? [];
    group.push({
      seasonId,
      player,
      payload,
      team: payload.teams.find((team) => team.id === player.teamId),
    });
    playerGroups.set(identity, group);
  }
}

for (const [identity, recordsInput] of playerGroups) {
  const records = recordsInput.slice().sort((a, b) => b.seasonId.localeCompare(a.seasonId));
  const latest = records[0];
  const canonicalRoute = `/players/${identity}`;
  const totals = records.reduce(
    (acc, record) => {
      const stats = playerStats(record.payload, record.player.id);
      acc.goals += stats.goals;
      acc.yellowCards += stats.yellowCards;
      acc.secondYellowDismissals += stats.secondYellowDismissals;
      acc.directRedCards += stats.directRedCards;
      acc.eventMatches += stats.eventMatches;
      return acc;
    },
    { goals: 0, yellowCards: 0, secondYellowDismissals: 0, directRedCards: 0, eventMatches: 0 },
  );
  const title = `${latest.player.name}｜D LEAGUE 官方球員資料｜${SITE_NAME}`;
  const description = `${latest.player.name} D LEAGUE 官方球員頁，包含歷年效力球隊、賽季紀錄、進球 ${totals.goals} 球、黃牌 ${totals.yellowCards} 張及比賽事件`;
  const image = absoluteAssetUrl(latest.payload.playerImages[latest.player.name] || latest.team?.logo);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: latest.player.name,
    alternateName: latest.player.englishName || undefined,
    nationality: latest.player.nationality || undefined,
    url: routeUrl(canonicalRoute),
    image: latest.payload.playerImages[latest.player.name] ? image : undefined,
    affiliation: latest.team ? {
      '@type': 'SportsTeam',
      name: latest.team.name,
      url: routeUrl(`/teams/${latest.team.identityId ?? latest.team.id}`),
    } : organizationReference,
  };

  const historyBody = records.map((record) => {
    const stats = playerStats(record.payload, record.player.id);
    const teamIdentity = record.team ? safeEntityId(record.team.identityId ?? record.team.id, 'team') : null;
    const teamText = record.team
      ? `<a href="${escapeHtml(routeUrl(`/teams/${teamIdentity}`))}">${escapeHtml(record.team.name)}</a>`
      : '未指定球隊';
    return `<li>${escapeHtml(getSeasonDisplayName(record.seasonId))}：${teamText}；進球 ${stats.goals}、黃牌 ${stats.yellowCards}、雙黃 ${stats.secondYellowDismissals}、紅牌 ${stats.directRedCards}</li>`;
  }).join('');
  const recentEvents = [];
  for (const record of records) {
    Object.entries(record.payload.events).forEach(([matchId, events]) => {
      const ownEvents = events.filter(
        (event) => (event.playerId ?? event.subjectId) === record.player.id,
      );
      if (!ownEvents.length) return;
      const match = record.payload.matches.find((candidate) => candidate.id === matchId);
      if (!match) return;
      recentEvents.push({
        seasonId: record.seasonId,
        match,
        text: ownEvents.map((event) => `${event.minute}' ${event.type}`).join('、'),
      });
    });
  }
  recentEvents.sort((a, b) => new Date(b.match.timestamp).getTime() - new Date(a.match.timestamp).getTime());
  const eventBody = recentEvents.length
    ? `<h2>個人比賽事件</h2><ul>${recentEvents.slice(0, 20).map((item) =>
        `<li><a href="${escapeHtml(routeUrl(`/matches/${item.match.id}`))}">${escapeHtml(item.match.timestamp?.slice(0, 10))} ${escapeHtml(item.text)}</a></li>`
      ).join('')}</ul>`
    : '<p>目前沒有可連結的個人比賽事件。</p>';

  const staticContent = staticShell(
    latest.player.name,
    description,
    `<p>歷年事件比賽 ${totals.eventMatches} 場；進球 ${totals.goals}；黃牌 ${totals.yellowCards}；雙黃 ${totals.secondYellowDismissals}；紅牌 ${totals.directRedCards}。</p>
     <h2>歷年賽季</h2><ul>${historyBody}</ul>${eventBody}`,
  );
  const routeIds = new Set([identity, ...records.map(({ player }) => safeEntityId(player.id, 'player'))]);
  for (const routeId of routeIds) {
    const route = `/players/${routeId}`;
    await writeRoute(route, renderHtml({
      route,
      canonicalRoute,
      title,
      description,
      image,
      type: 'profile',
      schemas: [schema],
      staticContent,
    }));
  }
  addSitemapEntry(canonicalRoute);
}

const seenMatchIds = new Map();
for (const seasonId of SEASON_IDS) {
  const payload = seasonPayloads[seasonId];
  const teamMap = Object.fromEntries(payload.teams.map((team) => [team.id, team]));
  const playerMap = Object.fromEntries(payload.players.map((player) => [player.id, player]));

  for (const match of payload.matches) {
    const matchId = safeEntityId(match.id, 'match');
    if (seenMatchIds.has(matchId)) {
      throw new Error(`Match id must be globally unique across seasons: ${matchId} (${seenMatchIds.get(matchId)} and ${seasonId})`);
    }
    seenMatchIds.set(matchId, seasonId);

    const home = teamMap[match.homeTeamId];
    const away = teamMap[match.awayTeamId];
    if (!home || !away) continue;

    const route = `/matches/${matchId}`;
    const hasScore = match.homeScore !== null && match.awayScore !== null;
    const score = hasScore ? `${match.homeScore}-${match.awayScore}` : 'vs';
    const title = `${home.shortName} ${score} ${away.shortName}｜${getSeasonDisplayName(seasonId)}｜${SITE_NAME}`;
    const description = `${getSeasonDisplayName(seasonId)} ${match.league} 第 ${match.round} 輪：${home.name} 對 ${away.name}，官方比賽時間、地點、比數、進球與紅黃牌紀錄`;
    const image = absoluteAssetUrl(home.logo || DEFAULT_SOCIAL_IMAGE);

    const teamSchema = (team) => ({
      '@type': 'SportsTeam',
      name: team.name,
      url: routeUrl(`/teams/${team.identityId ?? team.id}`),
    });
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${home.name} vs ${away.name}`,
      description,
      startDate: match.timestamp,
      eventStatus: match.status === 'FINISHED' || hasScore
        ? 'https://schema.org/EventCompleted'
        : 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: match.venue },
      homeTeam: teamSchema(home),
      awayTeam: teamSchema(away),
      competitor: [teamSchema(home), teamSchema(away)],
      organizer: organizationReference,
      url: routeUrl(route),
    };

    const insights = getRoundInsights(payload, match);
    const topScorerText = insights.topScorer
      ? `${insights.topScorer.name} ${insights.topScorer.goals} 球`
      : '尚無進球資料';
    const insightBody = `<h2>第 ${escapeHtml(match.round)} 輪數據洞察</h2>
      <ul>
        <li>已完成比賽：${insights.completedMatches}</li>
        <li>本輪總進球：${insights.totalGoals}</li>
        <li>場均進球：${insights.averageGoals.toFixed(1)}</li>
        <li>最大勝差：${insights.biggestMargin}</li>
        <li>本輪目前進球最多：${escapeHtml(topScorerText)}</li>
      </ul>`;

    const events = payload.events[match.id] ?? [];
    const eventBody = events.length
      ? `<h2>比賽事件</h2><ul>${events.map((event) => {
          const playerId = event.playerId ?? event.subjectId;
          const player = playerId ? playerMap[playerId] : undefined;
          const playerIdentity = player ? safeEntityId(player.identityId ?? player.id, 'player') : null;
          const playerText = playerIdentity
            ? `<a href="${escapeHtml(routeUrl(`/players/${playerIdentity}`))}">${escapeHtml(event.player)}</a>`
            : escapeHtml(event.player);
          return `<li>${escapeHtml(event.minute)}' ${playerText} — ${escapeHtml(event.type)}</li>`;
        }).join('')}</ul>`
      : '<p>目前沒有已登錄的比賽事件。</p>';

    const staticContent = staticShell(
      `${home.name} ${score} ${away.name}`,
      description,
      `<p>${escapeHtml(match.timestamp)} · ${escapeHtml(match.venue)}</p>${insightBody}${eventBody}`,
    );

    await writeRoute(route, renderHtml({
      route,
      title,
      description,
      image,
      schemas: [schema],
      staticContent,
    }));
    addSitemapEntry(route, match.timestamp?.slice(0, 10));
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...sitemapEntries.values()]
  .map(({ url, lastmod }) => `  <url><loc>${escapeHtml(url)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`)
  .join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
await fs.writeFile(
  path.join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);

console.log(`Static SEO generated for ${sitemapEntries.size} canonical routes`);
