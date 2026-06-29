import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CURRENT_SEASON_ID,
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

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const absoluteAssetUrl = (value) => {
  const asset = value || DEFAULT_SOCIAL_IMAGE;
  if (/^https?:\/\//.test(asset)) return asset;
  return `${SITE_URL}/${asset.replace(/^\/+/, '').replace(/^d-league\//, '')}`;
};
const routeUrl = (route) => `${SITE_URL}${route === '/' ? '/' : route}`;

const upsertMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const renderHtml = ({ route, title, description, image, type = 'website', schemas = [] }) => {
  const canonical = routeUrl(route);
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
  return html.replace('</head>', `${schemaTags ? `${schemaTags}\n` : ''}  </head>`);
};

const writeRoute = async (route, html) => {
  const outputPath = route === '/'
    ? templatePath
    : path.join(distDir, route.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  sport: 'Association Football',
  sameAs: SITE_SOCIAL_URLS,
};
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'zh-Hant',
};

const sitemapEntries = [];
const addSitemapEntry = (route, lastmod) => {
  sitemapEntries.push({ url: routeUrl(route), lastmod });
};

for (const [route, entry] of Object.entries(PAGE_SEO)) {
  const title = `${entry.label}｜${SITE_NAME}`;
  const html = renderHtml({
    route,
    title,
    description: entry.description,
    image: absoluteAssetUrl(DEFAULT_SOCIAL_IMAGE),
    schemas: route === '/' ? [organizationSchema, websiteSchema] : [organizationSchema],
  });
  await writeRoute(route, html);
  addSitemapEntry(route);
}

const articles = [];
for (const seasonId of SEASON_IDS) {
  const seasonNews = JSON.parse(
    await fs.readFile(path.join(dataDir, seasonId, 'news.json'), 'utf8'),
  );
  for (const article of seasonNews) articles.push({ ...article, seasonId });
}

for (const article of articles) {
  if (!article.id || article.id.includes('/')) throw new Error(`Invalid news route id: ${article.id}`);
  const route = `/news/${article.id}`;
  const seasonDisplayName = getSeasonDisplayName(article.seasonId);
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
    author: organizationSchema,
    publisher: organizationSchema,
  };
  await writeRoute(route, renderHtml({
    route,
    title,
    description,
    image,
    type: 'article',
    schemas: [schema],
  }));
  addSitemapEntry(route, article.timestamp?.slice(0, 10));
}

const currentTeams = JSON.parse(
  await fs.readFile(path.join(dataDir, CURRENT_SEASON_ID, 'teams.json'), 'utf8'),
);
for (const team of currentTeams) {
  if (!team.id || team.id.includes('/')) throw new Error(`Invalid team route id: ${team.id}`);
  const route = `/teams/${team.id}`;
  const description = `${team.name}於 ${getSeasonDisplayName(CURRENT_SEASON_ID)} ${team.leagueId} 的球員名單、賽程、賽果及球隊數據`;
  const image = absoluteAssetUrl(team.logo);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    alternateName: team.shortName,
    sport: 'Association Football',
    url: routeUrl(route),
    logo: image,
    memberOf: organizationSchema,
  };
  await writeRoute(route, renderHtml({
    route,
    title: `${team.name}｜${getSeasonDisplayName(CURRENT_SEASON_ID)}｜${SITE_NAME}`,
    description,
    image,
    schemas: [schema],
  }));
  addSitemapEntry(route);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries
  .map(({ url, lastmod }) => `  <url><loc>${escapeHtml(url)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`)
  .join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
await fs.writeFile(
  path.join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);

console.log(`Static SEO generated for ${sitemapEntries.length} routes`);
