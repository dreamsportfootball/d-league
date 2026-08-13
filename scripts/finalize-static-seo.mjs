import fs from 'node:fs/promises';
import path from 'node:path';
import { SEASON_IDS, SITE_NAME, SITE_URL } from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routeFile = (route) =>
  route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.replace(/^\//, ''), 'index.html');
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));

const staticShell = (title, subtitle, body = '') => `
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

const setCanonical = (html, route) => {
  const canonical = `${SITE_URL}${route}`;
  const tag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const pattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const matchLinkPattern = new RegExp(
  `<a\\s+href=["']${escapeRegExp(SITE_URL)}\\/matches\\/[^"']+["']>([\\s\\S]*?)<\\/a>`,
  'g',
);
const matchSchemaUrlPattern = new RegExp(
  `,"url":"${escapeRegExp(SITE_URL)}\\/matches\\/[^"]+"`,
  'g',
);

const unwrapMatchLinks = (html) => html.replace(matchLinkPattern, '$1');
const removeMatchSchemaUrls = (html) => html.replace(matchSchemaUrlPattern, '');
const normalizeDismissalLabels = (html) =>
  html
    .replace(/、雙黃\s*(\d+)\s*、紅牌\s*(\d+)/g, (_match, secondYellow, directRed) =>
      `、紅牌 ${Number(secondYellow) + Number(directRed)}`,
    )
    .replace(/；雙黃\s*(\d+)\s*；紅牌\s*(\d+)/g, (_match, secondYellow, directRed) =>
      `；紅牌 ${Number(secondYellow) + Number(directRed)}`,
    );

const updateRoute = async (route, transform) => {
  const file = routeFile(route);
  let html = await fs.readFile(file, 'utf8');
  html = transform(html);
  await fs.writeFile(file, html);
};

await updateRoute('/schedule', (html) =>
  unwrapMatchLinks(html)
    .replaceAll('D LEAGUE 歷年官方賽程、比賽結果與單場比賽頁', 'D LEAGUE 歷年官方賽程、比賽結果與輪次資料'),
);

await updateRoute('/stats', (html) => normalizeDismissalLabels(html));

const playerRoutes = new Set();
const matchRoutes = new Set();
const roundRoutes = new Set();

for (const seasonId of SEASON_IDS) {
  const players = await readJson(seasonId, 'players.json');
  const matches = await readJson(seasonId, 'matches.json');

  for (const player of players) {
    playerRoutes.add(`/players/${player.id}`);
    playerRoutes.add(`/players/${player.identityId ?? player.id}`);
  }

  for (const match of matches) {
    matchRoutes.add(`/matches/${match.id}`);
    roundRoutes.add(`/rounds/${seasonId}/${match.league}/${encodeURIComponent(String(match.round))}`);
  }
}

for (const route of playerRoutes) {
  await updateRoute(route, (html) => normalizeDismissalLabels(unwrapMatchLinks(html)));
}

for (const route of roundRoutes) {
  await updateRoute(route, (html) =>
    removeMatchSchemaUrls(unwrapMatchLinks(html))
      .replaceAll('數據洞察', '本輪數據'),
  );
}

for (const route of matchRoutes) {
  await updateRoute(route, (html) => {
    const description = '此舊比賽網址保留作相容入口，開啟後會導向 D LEAGUE 賽程與結果並顯示該場比賽卡片';
    let next = html.replace(/\s*<script type="application\/ld\+json" data-static-seo>[\s\S]*?<\/script>/g, '');
    next = next.replace(/<title>[\s\S]*?<\/title>/i, `<title>賽程與結果｜${escapeHtml(SITE_NAME)}</title>`);
    next = upsertMeta(next, 'name', 'description', description);
    next = upsertMeta(next, 'name', 'robots', 'noindex,follow');
    next = upsertMeta(next, 'property', 'og:title', `賽程與結果｜${SITE_NAME}`);
    next = upsertMeta(next, 'property', 'og:description', description);
    next = upsertMeta(next, 'property', 'og:url', `${SITE_URL}/schedule`);
    next = upsertMeta(next, 'name', 'twitter:title', `賽程與結果｜${SITE_NAME}`);
    next = upsertMeta(next, 'name', 'twitter:description', description);
    next = setCanonical(next, '/schedule');
    return replaceStaticBody(
      next,
      staticShell(
        '賽程與結果',
        description,
        '<p>此網址會由網站自動帶回賽程頁並開啟原本的比賽卡片。</p>',
      ),
    );
  });
}

const sitemapPath = path.join(distDir, 'sitemap.xml');
let sitemap = await fs.readFile(sitemapPath, 'utf8');
sitemap = sitemap.replace(
  new RegExp(`\\s*<url><loc>${escapeRegExp(SITE_URL)}\\/matches\\/[^<]+<\\/loc>(?:<lastmod>[^<]+<\\/lastmod>)?<\\/url>`, 'g'),
  '',
);
await fs.writeFile(sitemapPath, sitemap);

console.log(
  `Static SEO finalized: ${playerRoutes.size} player route(s), ${roundRoutes.size} round route(s), ${matchRoutes.size} compatibility match route(s)`,
);
