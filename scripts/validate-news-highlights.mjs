import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const seasonsRoot = join(root, 'data', 'seasons');
const read = (season, file) => JSON.parse(readFileSync(join(seasonsRoot, season, file), 'utf8'));
const fail = (message) => { throw new Error(message); };

for (const season of SEASON_IDS) {
  const news = read(season, 'news.json');
  const highlights = read(season, 'highlights.json');
  const newsIds = new Set(news.map((article) => article.id));
  const highlightIds = Object.keys(highlights);

  for (const article of news) {
    const highlight = highlights[article.id];
    if (typeof highlight !== 'string' || !highlight.trim()) {
      fail(`${season} news ${article.id}: missing reviewed highlight`);
    }
    if (highlight.trim().length > 120) {
      fail(`${season} news ${article.id}: highlight exceeds 120 characters`);
    }
  }

  for (const articleId of highlightIds) {
    if (!newsIds.has(articleId)) {
      fail(`${season} highlights: unknown news article ${articleId}`);
    }
  }

  if (highlightIds.length !== news.length) {
    fail(`${season} highlights: expected ${news.length}, received ${highlightIds.length}`);
  }

  console.log(`${season}: ${highlightIds.length} reviewed news highlights`);
}
