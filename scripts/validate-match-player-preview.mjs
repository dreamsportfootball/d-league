import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league/preview/season-2026-27').replace(/\/$/, '');
const dataBase = new URL('../data/seasons/2026-27/', import.meta.url);
const read = async (filename) => JSON.parse(await readFile(new URL(filename, dataBase), 'utf8'));
const [players, matches, events] = await Promise.all([
  read('players.json'), read('matches.json'), read('matchEvents.json'),
]);
const testMatch = matches.find((match) => match.status === 'FINISHED'
  && Array.isArray(events[match.id]) && events[match.id].some((event) => event.type === 'GOAL'));
const knownGoals = testMatch ? events[testMatch.id].filter((event) => event.type === 'GOAL').length : 0;
const testPlayer = players.find((player) => player.id === 'ch26-02')
  ?? players.find((player) => Object.values(events).some((matchEvents) =>
    matchEvents.some((event) => event.playerId === player.id && event.type === 'GOAL')));
if (!testMatch || !testPlayer) throw new Error('Missing grounded match/player test data');

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 812 : 900 },
      locale: 'zh-TW', timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block', reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(16000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(base + '/#/schedule?season=2026-27&match=' + encodeURIComponent(testMatch.id), { waitUntil: 'domcontentloaded', timeout: 30000 });
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible', timeout: 30000 });
      const flow = dialog.locator('[data-match-flow]');
      await flow.waitFor({ state: 'visible' });
      if (!await flow.getByText(String(knownGoals), { exact: true }).count()) throw new Error('Recorded goal total missing from match flow');
      if (!await dialog.getByText('比賽事件', { exact: true }).count()) throw new Error('Existing match event timeline missing');
      if (!await dialog.getByText('對戰紀錄', { exact: true }).count()) throw new Error('Historical head-to-head section missing');
      await dialog.getByRole('button', { name: '關閉', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });

      await page.goto(base + '/#/players/' + encodeURIComponent(testPlayer.id) + '?season=2026-27', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const trend = page.locator('[data-player-season-trend]');
      await trend.waitFor({ state: 'visible', timeout: 30000 });
      const seasonBar = trend.locator('[data-player-season-goals="2026-27"]');
      if (!await seasonBar.count()) throw new Error('Current-season trend entry missing');
      await seasonBar.click();
      if ((await seasonBar.getAttribute('aria-pressed')) !== 'true') throw new Error('Season trend button not activated');
      if ((await page.getByRole('combobox', { name: '篩選比賽事件賽季' }).inputValue()) !== '2026-27') throw new Error('Trend did not update original season filter');
      const goals = page.locator('[data-player-event-filter="GOALS"]');
      await goals.click();
      if ((await goals.getAttribute('aria-pressed')) !== 'true') throw new Error('Goals filter did not activate');
      if (!await page.locator('[data-player-event-result-count]').count()) throw new Error('Event filter summary missing');
      const cards = page.locator('[data-player-event-filter="CARDS"]');
      await cards.click();
      if ((await cards.getAttribute('aria-pressed')) !== 'true') throw new Error('Cards filter did not activate');
      await page.locator('[data-player-event-filter="ALL"]').click();

      const dims = await page.evaluate(() => ({
        viewport: innerWidth,
        html: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      if (dims.html > width + 2 || dims.body > width + 2) throw new Error('Horizontal overflow ' + JSON.stringify(dims));
      if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
      console.log('[match-player-preview] PASS ' + width + 'px; match=' + testMatch.id + '; player=' + testPlayer.id);
    } catch (error) {
      failures.push(width + 'px: ' + error.message);
      console.error('[match-player-preview] FAIL ' + width + 'px: ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error('[match-player-preview] ' + failures.length + ' failure(s): ' + failures.join(' | '));
  process.exitCode = 1;
} else {
  console.log('[match-player-preview] PASS match details and player page');
}
