import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const allowedCategories = new Set(['Official', 'Match Report']);
const articleIds = new Set();

const fail = (message) => {
  throw new Error(message);
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => isNonEmptyString(value) && !Number.isNaN(new Date(value).getTime());
const isExternalUrl = (value) => /^https?:\/\//.test(value);

for (const seasonId of SEASON_IDS) {
  const filePath = join(root, 'data', 'seasons', seasonId, 'news.json');
  const articles = JSON.parse(readFileSync(filePath, 'utf8'));

  if (!Array.isArray(articles)) fail(`${seasonId} news: expected an array`);

  for (const article of articles) {
    const label = `${seasonId} news ${article?.id ?? '(missing id)'}`;

    if (!isNonEmptyString(article?.id)) fail(`${label}: id is required`);
    if (article.id.includes('/') || /\s/.test(article.id)) {
      fail(`${label}: id must be a stable URL-safe value without spaces or slashes`);
    }
    if (articleIds.has(article.id)) fail(`${label}: duplicate article id across seasons`);
    articleIds.add(article.id);

    if (article.seasonId !== seasonId) fail(`${label}: seasonId must match its data directory`);
    if (!isNonEmptyString(article.title)) fail(`${label}: title is required`);
    if (!isNonEmptyString(article.summary)) fail(`${label}: summary is required`);
    if (!isNonEmptyString(article.content)) fail(`${label}: content is required`);
    if (!allowedCategories.has(article.category)) fail(`${label}: unsupported category ${article.category ?? ''}`);
    if (!isValidDate(article.timestamp)) fail(`${label}: invalid timestamp`);

    if (typeof article.imageUrl !== 'string') fail(`${label}: imageUrl must be a string`);
    if (article.imageUrl.startsWith('/') || article.imageUrl.startsWith('d-league/')) {
      fail(`${label}: imageUrl must be relative to the configured site base`);
    }
    if (article.imageUrl && !isExternalUrl(article.imageUrl)) {
      const imagePath = join(root, 'public', article.imageUrl);
      if (!existsSync(imagePath)) fail(`${label}: missing image file ${article.imageUrl}`);
    }
    if (article.imageAlt !== undefined && !isNonEmptyString(article.imageAlt)) {
      fail(`${label}: imageAlt must be a non-empty string when provided`);
    }
  }
}

console.log(`News data validation passed for ${articleIds.size} articles`);
