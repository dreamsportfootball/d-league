import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_SOCIAL_IMAGE,
  SEASON_IDS,
  SITE_NAME,
  SITE_URL,
  getSeasonDisplayName,
} from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const templatePath = path.join(distDir, 'index.html');
const sourceTemplate = await fs.readFile(templatePath, 'utf8');

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
const routeUrl = (route) => `${SITE_URL}${route}`;
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));
const safeSegment = (value, label) => {
  const text = String(value ?? '');
  if (!text || text.includes('/')) throw new Error(`Invalid ${label}: ${text}`);
  return encodeURIComponent(text);
};

const upsertMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const cleanTemplate = (html) => html
  .replace(/\s*<script type="application\/ld\+json" data-static-seo>[\s\S]*?<\/script>/g, '')
  .replace(/\s*<main id="static-seo-content"[\s\S]*?<\/main>/g, '');

const renderHtml = ({ route, title, description, image, schema, staticContent }) => {
  const canonical = routeUrl(route);
  let html = cleanTemplate(sourceTemplate)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'property', 'og:type', 'website');
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

  const schemaJson = JSON.stringify(schema).replaceAll('<', '\\u003c');
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json" data-static-seo>${schemaJson}</script>\n  </head>`,
  );
  return html.replace('<div id="root"></div>', `${staticContent}\n    <div id="root"></div>`);
};

const getInsights = (matches, eventsByMatch) => {
  const completed = matches.filter(
    (match) =>
      (match.status === 'FINISHED' || (match.homeScore !== null && match.awayScore !== null)) &&
      match.homeScore !== null &&
      match.awayScore !== null,
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
    (eventsByMatch[match.id] ?? []).forEach((event) => {
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
    completedMatches: completed.length,
    totalGoals,
    averageGoals: completed.length ? totalGoals / completed.length : 0,
    biggestMargin,
    topScorer,
  };
};

const generatedRoutes = [];

for (const seasonId of SEASON_IDS) {
  const [matches, teams, players, eventsByMatch] = await Promise.all([
    readJson(seasonId, 'matches.json'),
    readJson(seasonId, 'teams.json'),
    readJson(seasonId, 'players.json'),
    readJson(seasonId, 'matchEvents.json'),
  ]);
  const teamMap = Object.fromEntries(teams.map((team) => [team.id, team]));
  const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
  const groups = new Map();

  matches.forEach((match) => {
    const key = `${match.league}::${String(match.round)}`;
    const list = groups.get(key) ?? [];
    list.push(match);
    groups.set(key, list);
  });

  for (const groupMatchesInput of groups.values()) {
    const groupMatches = groupMatchesInput
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const first = groupMatches[0];
    if (!first) continue;

    const league = safeSegment(first.league, 'league');
    const round = safeSegment(first.round, 'round');
    const route = `/rounds/${seasonId}/${league}/${round}`;
    const insights = getInsights(groupMatches, eventsByMatch);
    const seasonName = getSeasonDisplayName(seasonId);
    const title = `${seasonId.replace('-', '/')} ${first.league} 第 ${first.round} 輪｜D LEAGUE 官方數據｜${SITE_NAME}`;
    const description = `${seasonName} ${first.league} 第 ${first.round} 輪官方賽程、賽果與數據洞察；已完成 ${insights.completedMatches} 場、本輪目前共 ${insights.totalGoals} 球`;
    const image = absoluteAssetUrl(DEFAULT_SOCIAL_IMAGE);

    const itemList = groupMatches.map((match, index) => {
      const home = teamMap[match.homeTeamId];
      const away = teamMap[match.awayTeamId];
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: routeUrl(`/matches/${match.id}`),
        item: {
          '@type': 'SportsEvent',
          name: `${home?.name ?? match.homeTeamId} vs ${away?.name ?? match.awayTeamId}`,
          startDate: match.timestamp,
          url: routeUrl(`/matches/${match.id}`),
        },
      };
    });
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${seasonName} ${first.league} 第 ${first.round} 輪`,
      description,
      url: routeUrl(route),
      inLanguage: 'zh-Hant',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: itemList.length,
        itemListElement: itemList,
      },
    };

    const topScorerProfile = insights.topScorer?.playerId
      ? playerMap[insights.topScorer.playerId]
      : undefined;
    const topScorerIdentity = topScorerProfile
      ? safeSegment(topScorerProfile.identityId ?? topScorerProfile.id, 'player')
      : null;
    const topScorerText = insights.topScorer
      ? topScorerIdentity
        ? `<a href="${escapeHtml(routeUrl(`/players/${topScorerIdentity}`))}">${escapeHtml(insights.topScorer.name)}</a>（${insights.topScorer.goals} 球）`
        : `${escapeHtml(insights.topScorer.name)}（${insights.topScorer.goals} 球）`
      : '尚無進球資料';

    const matchList = groupMatches.map((match) => {
      const home = teamMap[match.homeTeamId];
      const away = teamMap[match.awayTeamId];
      const homeName = home?.name ?? match.homeTeamId;
      const awayName = away?.name ?? match.awayTeamId;
      const score = match.homeScore !== null && match.awayScore !== null
        ? `${match.homeScore}–${match.awayScore}`
        : 'vs';
      return `<li><a href="${escapeHtml(routeUrl(`/matches/${match.id}`))}">${escapeHtml(homeName)} ${escapeHtml(score)} ${escapeHtml(awayName)}</a> · ${escapeHtml(match.timestamp?.slice(0, 10))}</li>`;
    }).join('');

    const staticContent = `
  <main id="static-seo-content" style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <p style="font-size:12px;font-weight:700;color:#6b7280;margin:0 0 8px">D LEAGUE ROUND CENTER</p>
    <h1 style="font-size:32px;line-height:1.15;margin:0 0 12px">${escapeHtml(seasonName)} ${escapeHtml(first.league)} 第 ${escapeHtml(first.round)} 輪</h1>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px">${escapeHtml(description)}</p>
    <h2>本輪數據洞察</h2>
    <ul>
      <li>已完成比賽：${insights.completedMatches}</li>
      <li>本輪總進球：${insights.totalGoals}</li>
      <li>場均進球：${insights.averageGoals.toFixed(1)}</li>
      <li>最大勝差：${insights.biggestMargin}</li>
      <li>本輪目前進球最多：${topScorerText}</li>
    </ul>
    <h2>本輪賽程與賽果</h2>
    <ul>${matchList}</ul>
  </main>`;

    const html = renderHtml({ route, title, description, image, schema, staticContent });
    const outputPath = path.join(distDir, route.replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);

    const lastmod = groupMatches
      .map((match) => match.timestamp?.slice(0, 10))
      .filter(Boolean)
      .sort()
      .at(-1);
    generatedRoutes.push({ route, lastmod });
  }
}

if (generatedRoutes.length > 0) {
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  let sitemap = await fs.readFile(sitemapPath, 'utf8');
  const entries = generatedRoutes.map(({ route, lastmod }) =>
    `  <url><loc>${escapeHtml(routeUrl(route))}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`,
  ).join('\n');
  sitemap = sitemap.replace('</urlset>', `${entries}\n</urlset>`);
  await fs.writeFile(sitemapPath, sitemap);
}

console.log(`Static round SEO generated for ${generatedRoutes.length} routes`);
