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

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routeUrl = (route) => `${SITE_URL}${route === '/' ? '/' : route}`;
const absoluteAssetUrl = (value) => {
  const asset = value || DEFAULT_SOCIAL_IMAGE;
  if (/^https?:\/\//.test(asset)) return asset;
  return `${SITE_URL}/${String(asset).replace(/^\/+/, '').replace(/^d-league\//, '')}`;
};

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

const renderStandaloneRoute = ({
  template,
  route,
  title,
  description,
  image,
  schema,
  staticContent,
}) => {
  const canonical = routeUrl(route);
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'property', 'og:type', 'website');
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:image', image);

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const canonicalPattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace('</head>', `    ${canonicalTag}\n  </head>`);

  html = html.replace(/\s*<script type="application\/ld\+json" data-static-seo>[\s\S]*?<\/script>/g, '');
  const schemaJson = JSON.stringify(schema).replaceAll('<', '\\u003c');
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json" data-static-seo>${schemaJson}</script>\n  </head>`,
  );
  return replaceStaticBody(html, staticContent);
};

const matchIsResolved = (match) =>
  (match.homeScore !== null && match.awayScore !== null) || match.status === 'FINISHED';

const teamIdentity = (team) => team.identityId ?? team.id;
const playerIdentity = (player) => player.identityId ?? player.id;

const formatMatchLabel = (payload, match) => {
  const home = payload.teams.find((team) => team.id === match.homeTeamId);
  const away = payload.teams.find((team) => team.id === match.awayTeamId);
  if (!home || !away) return null;
  const score =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore}–${match.awayScore}`
      : 'vs';
  return {
    home,
    away,
    score,
    label: `${home.name} ${score} ${away.name}`,
  };
};

const buildScheduleBody = () =>
  [...SEASON_IDS].reverse().map((seasonId) => {
    const payload = payloads[seasonId];
    if (payload.matches.length === 0) {
      return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2><p>完整賽程尚未公布。</p></section>`;
    }

    const grouped = new Map();
    payload.matches
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((match) => {
        const key = `${match.league}|${match.round}`;
        const group = grouped.get(key) ?? [];
        group.push(match);
        grouped.set(key, group);
      });

    const groups = [...grouped.entries()].map(([key, matches]) => {
      const [league, round] = key.split('|');
      const roundRoute = `/rounds/${seasonId}/${league}/${encodeURIComponent(round)}`;
      const items = matches.map((match) => {
        const info = formatMatchLabel(payload, match);
        if (!info) return '';
        return `<li><a href="${escapeHtml(routeUrl(`/matches/${match.id}`))}">${escapeHtml(
          `${match.timestamp?.slice(0, 10)} ${info.label}`,
        )}</a></li>`;
      }).join('');
      return `<section>
        <h3><a href="${escapeHtml(routeUrl(roundRoute))}">${escapeHtml(league)} 第 ${escapeHtml(round)} 輪</a></h3>
        <ul>${items}</ul>
      </section>`;
    }).join('');

    return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2>${groups}</section>`;
  }).join('');

const computeTeamRecords = (payload, league) => {
  const rows = payload.teams
    .filter((team) => team.leagueId === league && team.competitionStatus !== 'WITHDRAWN')
    .map((team) => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    }));
  const map = new Map(rows.map((row) => [row.team.id, row]));

  payload.matches
    .filter((match) => match.league === league && matchIsResolved(match))
    .forEach((match) => {
      if (match.homeScore === null || match.awayScore === null) return;
      const home = map.get(match.homeTeamId);
      const away = map.get(match.awayTeamId);
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.gf += match.homeScore;
      home.ga += match.awayScore;
      away.gf += match.awayScore;
      away.ga += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      (b.gf - b.ga) - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.team.name.localeCompare(b.team.name, 'zh-TW'),
  );
};

const buildStandingsBody = () =>
  [...SEASON_IDS].reverse().map((seasonId) => {
    const payload = payloads[seasonId];
    const leagues = [...new Set(payload.teams.map((team) => team.leagueId))];
    if (leagues.length === 0) {
      return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2><p>球隊與積分資料尚未公布。</p></section>`;
    }

    const leagueBodies = leagues.map((league) => {
      const rows = computeTeamRecords(payload, league);
      const items = rows.map((row) => {
        const gd = row.gf - row.ga;
        return `<li>
          <a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(row.team)}`))}">${escapeHtml(row.team.name)}</a>
          — ${row.played} 場，${row.won} 勝 ${row.drawn} 和 ${row.lost} 敗，進 ${row.gf} 失 ${row.ga}，得失球 ${gd > 0 ? '+' : ''}${gd}，${row.points} 分
        </li>`;
      }).join('');
      return `<section>
        <h3>${escapeHtml(league)} 積分紀錄</h3>
        <ol>${items}</ol>
        <p>同分球隊的正式名次仍以 D LEAGUE 當季完整排名規則計算。</p>
      </section>`;
    }).join('');

    return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2>${leagueBodies}</section>`;
  }).join('');

const aggregatePlayerStats = (payload, league) => {
  const matchMap = new Map(payload.matches.map((match) => [match.id, match]));
  const stats = new Map();

  Object.entries(payload.events).forEach(([matchId, events]) => {
    const match = matchMap.get(matchId);
    if (!match || match.league !== league) return;

    events.forEach((event) => {
      const playerId = event.playerId ?? event.subjectId;
      if (!playerId) return;
      const player = payload.players.find((candidate) => candidate.id === playerId);
      if (!player) return;
      const current = stats.get(playerId) ?? {
        player,
        goals: 0,
        yellowCards: 0,
        secondYellowDismissals: 0,
        directRedCards: 0,
      };
      if (event.type === 'GOAL' && !event.isOwnGoal) current.goals += 1;
      if (event.type === 'YELLOW_CARD') current.yellowCards += 1;
      if (event.type === 'SECOND_YELLOW') {
        current.yellowCards += 1;
        current.secondYellowDismissals += 1;
      }
      if (event.type === 'RED_CARD') current.directRedCards += 1;
      stats.set(playerId, current);
    });
  });

  return [...stats.values()].sort(
    (a, b) =>
      b.goals - a.goals ||
      b.directRedCards - a.directRedCards ||
      b.secondYellowDismissals - a.secondYellowDismissals ||
      b.yellowCards - a.yellowCards ||
      a.player.name.localeCompare(b.player.name, 'zh-TW'),
  );
};

const buildStatsBody = () =>
  [...SEASON_IDS].reverse().map((seasonId) => {
    const payload = payloads[seasonId];
    const leagues = [...new Set(payload.teams.map((team) => team.leagueId))];
    if (leagues.length === 0) {
      return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2><p>球員數據尚未公布。</p></section>`;
    }

    const leagueBodies = leagues.map((league) => {
      const rows = aggregatePlayerStats(payload, league);
      if (rows.length === 0) {
        return `<section><h3>${escapeHtml(league)}</h3><p>目前尚無進球或牌卡事件。</p></section>`;
      }
      const items = rows.map((row) => {
        const team = payload.teams.find((candidate) => candidate.id === row.player.teamId);
        const teamText = team
          ? `<a href="${escapeHtml(routeUrl(`/teams/${teamIdentity(team)}`))}">${escapeHtml(team.name)}</a>`
          : '未指定球隊';
        return `<li>
          <a href="${escapeHtml(routeUrl(`/players/${playerIdentity(row.player)}`))}">${escapeHtml(row.player.name)}</a>
          — ${teamText}；進球 ${row.goals}、黃牌 ${row.yellowCards}、雙黃 ${row.secondYellowDismissals}、紅牌 ${row.directRedCards}
        </li>`;
      }).join('');
      return `<section><h3>${escapeHtml(league)} 球員數據</h3><ol>${items}</ol></section>`;
    }).join('');

    return `<section><h2>${escapeHtml(getSeasonDisplayName(seasonId))}</h2>${leagueBodies}</section>`;
  }).join('');

const enrichExistingRoute = async (route, title, description, body) => {
  const file = routeFile(route);
  const html = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, replaceStaticBody(html, staticShell(title, description, body)));
};

await enrichExistingRoute(
  '/schedule',
  'D LEAGUE 賽程與結果',
  'D LEAGUE 歷年官方賽程、比賽結果與單場比賽頁',
  buildScheduleBody(),
);
await enrichExistingRoute(
  '/standings',
  'D LEAGUE 積分資料',
  'D LEAGUE 歷年球隊積分、勝和負與得失球官方資料',
  buildStandingsBody(),
);
await enrichExistingRoute(
  '/stats',
  'D LEAGUE 球員數據',
  'D LEAGUE 歷年射手、進球、紅黃牌與球員官方資料',
  buildStatsBody(),
);

const baseTemplate = await fs.readFile(routeFile('/'), 'utf8');
const roundRoutes = [];

for (const seasonId of SEASON_IDS) {
  const payload = payloads[seasonId];
  const teamMap = new Map(payload.teams.map((team) => [team.id, team]));
  const playerMap = new Map(payload.players.map((player) => [player.id, player]));
  const groups = new Map();

  payload.matches.forEach((match) => {
    const key = `${match.league}|${match.round}`;
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  });

  for (const [key, matchesInput] of groups) {
    const [league, round] = key.split('|');
    const matches = matchesInput
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const route = `/rounds/${seasonId}/${league}/${encodeURIComponent(round)}`;
    const completed = matches.filter(
      (match) =>
        match.homeScore !== null &&
        match.awayScore !== null &&
        matchIsResolved(match),
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
    matches.forEach((match) => {
      (payload.events[match.id] ?? []).forEach((event) => {
        if (event.type !== 'GOAL' || event.isOwnGoal) return;
        const playerId = event.playerId ?? event.subjectId;
        const keyValue = playerId ?? event.player;
        const current = scorerMap.get(keyValue) ?? {
          playerId,
          name: event.player,
          goals: 0,
        };
        current.goals += 1;
        scorerMap.set(keyValue, current);
      });
    });
    const topScorer = [...scorerMap.values()].sort(
      (a, b) => b.goals - a.goals || String(a.name).localeCompare(String(b.name), 'zh-TW'),
    )[0];

    const matchItems = matches.map((match) => {
      const home = teamMap.get(match.homeTeamId);
      const away = teamMap.get(match.awayTeamId);
      if (!home || !away) return '';
      const score =
        match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore}–${match.awayScore}`
          : 'vs';
      return `<li>
        <a href="${escapeHtml(routeUrl(`/matches/${match.id}`))}">${escapeHtml(
          `${match.timestamp?.slice(0, 10)} ${home.name} ${score} ${away.name}`,
        )}</a>
      </li>`;
    }).join('');

    let scorerBody = '<p>目前尚無進球資料。</p>';
    if (topScorer) {
      const player = topScorer.playerId ? playerMap.get(topScorer.playerId) : undefined;
      scorerBody = player
        ? `<p>本輪目前進球最多：<a href="${escapeHtml(routeUrl(`/players/${playerIdentity(player)}`))}">${escapeHtml(topScorer.name)}</a>，${topScorer.goals} 球。</p>`
        : `<p>本輪目前進球最多：${escapeHtml(topScorer.name)}，${topScorer.goals} 球。</p>`;
    }

    const description = `${getSeasonDisplayName(seasonId)} ${league} 第 ${round} 輪官方賽程、賽果與數據洞察；已完成 ${completed.length} 場、本輪目前共 ${totalGoals} 球`;
    const title = `${getSeasonDisplayName(seasonId)} ${league} 第 ${round} 輪｜D LEAGUE 官方數據`;
    const body = `
      <section>
        <h2>本輪數據洞察</h2>
        <ul>
          <li>已完成比賽：${completed.length}</li>
          <li>本輪總進球：${totalGoals}</li>
          <li>場均進球：${completed.length ? (totalGoals / completed.length).toFixed(1) : '0.0'}</li>
          <li>最大勝差：${biggestMargin}</li>
        </ul>
        ${scorerBody}
      </section>
      <section><h2>本輪賽程與賽果</h2><ul>${matchItems}</ul></section>`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: routeUrl(route),
      inLanguage: 'zh-Hant',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: matches.map((match, index) => {
          const home = teamMap.get(match.homeTeamId);
          const away = teamMap.get(match.awayTeamId);
          return {
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'SportsEvent',
              name: home && away ? `${home.name} vs ${away.name}` : match.id,
              startDate: match.timestamp,
              url: routeUrl(`/matches/${match.id}`),
            },
          };
        }),
      },
    };

    const image = absoluteAssetUrl(DEFAULT_SOCIAL_IMAGE);
    const html = renderStandaloneRoute({
      template: baseTemplate,
      route,
      title: `${title}｜${SITE_NAME}`,
      description,
      image,
      schema,
      staticContent: staticShell(title, description, body),
    });
    const outputPath = routeFile(route);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
    roundRoutes.push(route);
  }
}

const sitemapPath = path.join(distDir, 'sitemap.xml');
let sitemap = await fs.readFile(sitemapPath, 'utf8');
const additions = roundRoutes
  .filter((route) => !sitemap.includes(`<loc>${routeUrl(route)}</loc>`))
  .map((route) => `  <url><loc>${escapeHtml(routeUrl(route))}</loc></url>`)
  .join('\n');
if (additions) {
  sitemap = sitemap.replace('</urlset>', `${additions}\n</urlset>`);
  await fs.writeFile(sitemapPath, sitemap);
}

console.log(
  `Static data enrichment complete: schedule, standings, stats and ${roundRoutes.length} round page(s)`,
);
