import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['components', 'pages', 'hooks'];
const forbidden = [
  /(?:document\.body|\bbody)\.style\.overflow\s*=/g,
  /(?:document\.documentElement|\bhtml)\.style\.overflow\s*=/g,
  /(?:document\.documentElement|\bhtml)\.style\.scrollbarGutter\s*=/g,
];

const collect = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(filename);
    return /\.tsx?$/.test(filename) ? [filename] : [];
  }));
  return nested.flat();
};

test('UI overlays must use the shared scroll lock instead of inline body/html mutations', async () => {
  const files = (await Promise.all(roots.map(collect))).flat();
  const violations = [];
  for (const filename of files) {
    const source = await readFile(filename, 'utf8');
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(source)) violations.push(filename + ': ' + pattern.source);
    }
  }
  assert.deepEqual(violations, [], 'Use hooks/useModalScrollLock instead of direct scroll locks');
});
