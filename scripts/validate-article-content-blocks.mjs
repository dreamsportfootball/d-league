import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const allowedTypes = new Set([
  'paragraph',
  'heading',
  'list',
  'matchInfo',
  'keyFacts',
  'timeline',
  'notice',
  'cta',
]);

const read = (seasonId, fileName) =>
  JSON.parse(readFileSync(join(root, 'data', 'seasons', seasonId, fileName), 'utf8'));

const fail = (message) => {
  throw new Error(message);
};

const requireString = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) fail(`${label}: must be a non-empty string`);
};

for (const seasonId of SEASON_IDS) {
  const news = read(seasonId, 'news.json');
  const contentMap = read(seasonId, 'articleContentBlocks.json');
  const articleIds = new Set(news.map((article) => article.id));

  if (!contentMap || typeof contentMap !== 'object' || Array.isArray(contentMap)) {
    fail(`${seasonId}: articleContentBlocks.json must contain an object`);
  }

  for (const [articleId, blocks] of Object.entries(contentMap)) {
    if (!articleIds.has(articleId)) fail(`${seasonId}: unknown article content id ${articleId}`);
    if (!Array.isArray(blocks) || blocks.length === 0) {
      fail(`${seasonId} ${articleId}: blocks must be a non-empty array`);
    }

    blocks.forEach((block, index) => {
      const label = `${seasonId} ${articleId} block ${index + 1}`;
      if (!block || typeof block !== 'object' || Array.isArray(block)) fail(`${label}: invalid block`);
      if (!allowedTypes.has(block.type)) fail(`${label}: unsupported type ${block.type ?? ''}`);

      if (block.type === 'paragraph') {
        requireString(block.text, `${label} text`);
        if (block.variant && !['default', 'lead'].includes(block.variant)) {
          fail(`${label}: invalid paragraph variant`);
        }
      }

      if (block.type === 'heading') requireString(block.text, `${label} text`);

      if (block.type === 'list') {
        if (!Array.isArray(block.items) || block.items.length === 0) fail(`${label}: list items are required`);
        block.items.forEach((item, itemIndex) => requireString(item, `${label} item ${itemIndex + 1}`));
      }

      if (block.type === 'matchInfo') {
        for (const field of ['competition', 'round', 'homeTeam', 'awayTeam']) {
          requireString(block[field], `${label} ${field}`);
        }
        if (!Number.isInteger(block.homeScore) || !Number.isInteger(block.awayScore)) {
          fail(`${label}: match scores must be integers`);
        }
        if (block.dateLabel !== undefined) requireString(block.dateLabel, `${label} dateLabel`);
      }

      if (block.type === 'keyFacts') {
        if (!Array.isArray(block.items) || block.items.length === 0) fail(`${label}: key facts are required`);
        block.items.forEach((item, itemIndex) => {
          requireString(item?.label, `${label} fact ${itemIndex + 1} label`);
          requireString(item?.value, `${label} fact ${itemIndex + 1} value`);
        });
      }

      if (block.type === 'timeline') {
        if (!Array.isArray(block.items) || block.items.length === 0) fail(`${label}: timeline items are required`);
        block.items.forEach((item, itemIndex) => {
          requireString(item?.time, `${label} timeline ${itemIndex + 1} time`);
          requireString(item?.text, `${label} timeline ${itemIndex + 1} text`);
        });
      }

      if (block.type === 'notice') {
        requireString(block.text, `${label} text`);
        if (block.title !== undefined) requireString(block.title, `${label} title`);
      }

      if (block.type === 'cta') {
        requireString(block.label, `${label} label`);
        requireString(block.href, `${label} href`);
      }
    });
  }

  console.log(`${seasonId}: ${Object.keys(contentMap).length} structured article layouts`);
}
