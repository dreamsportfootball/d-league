import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SEASON_IDS,
  SITE_NAME,
  SITE_URL,
  getSeasonDisplayName,
} from '../config/siteManifest.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const dataDir = path.join(root, 'data', 'seasons');
const SOCIAL_IMAGE = `${SITE_URL}/banner.png`;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const readJson = async (seasonId, fileName) =>
  JSON.parse(await fs.readFile(path.join(dataDir, seasonId, fileName), 'utf8'));
const upsertMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};
const upsertCanonical = (html, canonical) => {
  const tag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const pattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};
const formatTaipeiDateTime = (timestamp) => new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(timestamp));

const sitemapPath = path.join(distDir, 'sitemap.xml');
let sitemap = await fs.readFile(sitemapPath, 'utf8');
let enrichedCount = 0;
const seenMatchIds = new Set();

for (const seasonId of SEASON_IDS) {
  const [teams, matches] = await Promise.all([
    readJson(seasonId, 'teams.json'),
    readJson(seasonId, 'matches.json'),
  ]);
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  for (const match of matches) {
    if (seenMatchIds.has(match.id)) {
      throw new Error(`Match id must be globally unique across seasons: ${match.id}`);
    }
    seenMatchIds.add(match.id);

    const homeTeam = teamMap.get(match.homeTeamId);
    const awayTeam = teamMap.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    const route = `/matches/${encodeURIComponent(match.id)}`;
    const canonical = `${SITE_URL}${route}`;
    const routeFile = path.join(distDir, 'matches', encodeURIComponent(match.id), 'index.html');
    let html = await fs.readFile(routeFile, 'utf8');
    const isFinished = match.homeScore !== null && match.awayScore !== null;
    const scoreLabel = isFinished
      ? `${match.homeScore}-${match.awayScore}`
      : 'vs';
    const seasonName = getSeasonDisplayName(seasonId);
    const title = `${homeTeam.shortName || homeTeam.name} ${scoreLabel} ${awayTeam.shortName || awayTeam.name}｜${seasonName}｜${SITE_NAME}`;
    const statusText = isFinished
      ? `最終比數 ${homeTeam.name} ${match.homeScore}-${match.awayScore} ${awayTeam.name}`
      : `${homeTeam.name} 對 ${awayTeam.name}`;
    const description = `${seasonName} ${match.league} 第 ${match.round} 輪｜${formatTaipeiDateTime(match.timestamp)}｜${statusText}｜${match.venue}`;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = upsertMeta(html, 'name', 'description', description);
    html = upsertMeta(html, 'property', 'og:title', title);
    html = upsertMeta(html, 'property', 'og:description', description);
    html = upsertMeta(html, 'property', 'og:image', SOCIAL_IMAGE);
    html = upsertMeta(html, 'property', 'og:image:alt', `${homeTeam.name} vs ${awayTeam.name}｜D LEAGUE`);
    html = upsertMeta(html, 'property', 'og:url', canonical);
    html = upsertMeta(html, 'property', 'og:type', 'website');
    html = upsertMeta(html, 'property', 'og:site_name', SITE_NAME);
    html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = upsertMeta(html, 'name', 'twitter:title', title);
    html = upsertMeta(html, 'name', 'twitter:description', description);
    html = upsertMeta(html, 'name', 'twitter:image', SOCIAL_IMAGE);
    html = upsertCanonical(html, canonical);
    html = html.replace(/\s*<meta\s+[^>]*name=["']robots["'][^>]*>/i, '');

    const sportsEventSchema = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${homeTeam.name} vs ${awayTeam.name}`,
      startDate: match.timestamp,
      eventStatus: isFinished
        ? 'https://schema.org/EventCompleted'
        : 'https://schema.org/EventScheduled',
      sport: 'Association Football',
      url: canonical,
      location: {
        '@type': 'Place',
        name: match.venue,
      },
      homeTeam: {
        '@type': 'SportsTeam',
        name: homeTeam.name,
      },
      awayTeam: {
        '@type': 'SportsTeam',
        name: awayTeam.name,
      },
      organizer: {
        '@type': 'SportsOrganization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    };
    const schemaTag = `    <script type="application/ld+json" data-match-share-seo>${JSON.stringify(sportsEventSchema).replaceAll('<', '\\u003c')}</script>`;
    html = html.replace(/\s*<script type="application\/ld\+json" data-match-share-seo>[\s\S]*?<\/script>/g, '');
    html = html.replace('</head>', `${schemaTag}\n  </head>`);

    await fs.writeFile(routeFile, html);
    const sitemapEntry = `<url><loc>${escapeHtml(canonical)}</loc></url>`;
    if (!sitemap.includes(`<loc>${escapeHtml(canonical)}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `  ${sitemapEntry}\n</urlset>`);
    }
    enrichedCount += 1;
  }
}

await fs.writeFile(sitemapPath, sitemap);
console.log(`Match social SEO enriched for ${enrichedCount} canonical match routes`);
