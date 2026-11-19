import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league/preview/season-2026-27').replace(/\/$/, '');
const teams = JSON.parse(await readFile(new URL('../data/seasons/2026-27/teams.json', import.meta.url), 'utf8'));
const favored = teams.find((team) => team.competitionStatus !== 'WITHDRAWN');
if (!favored) throw new Error('No active team found for matchday navigator test');
const favoriteId = favored.identityId ?? favored.id;
const browser = await chromium.launch({ headless: true });
const widths = [320, 375, 414, 768, 1280];
const failures = [];

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 812 : 900 },
      timezoneId: 'Asia/Taipei',
      locale: 'zh-TW',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    await context.addInitScript((id) => {
      localStorage.setItem('dleague:followed-teams:v2', JSON.stringify([id]));
    }, favoriteId);
    const page = await context.newPage();
    page.setDefaultTimeout(17000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base + '/#/schedule?season=2026-27', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const hub = page.locator('[data-matchday-navigator]');
      await hub.waitFor({ state: 'visible', timeout: 30000 });
      const originalSchedule = page.locator('button[data-analytics-event="match_open"]:visible');
      if (await originalSchedule.count() === 0) throw new Error('Original schedule rows missing');
      const dates = hub.locator('[data-matchday-date]');
      const count = await dates.count();
      if (count < 2) throw new Error('Expected two or more distinct confirmed match days');
      if ((await hub.locator('[data-matchday-date][aria-pressed="true"]').count()) !== 1) {
        throw new Error('One selected date required');
      }
      const beforeIds = await hub.locator('[data-matchday-match]').evaluateAll((nodes) => nodes.map(node => node.getAttribute('data-matchday-match')));
      if (beforeIds.length === 0) throw new Error('Selected matchday has no fixtures');
      await dates.last().click();
      if ((await dates.last().getAttribute('aria-pressed')) !== 'true') throw new Error('Last date not activated');
      const afterIds = await hub.locator('[data-matchday-match]').evaluateAll((nodes) => nodes.map(node => node.getAttribute('data-matchday-match')));
      if (afterIds.length === 0 || JSON.stringify(beforeIds) === JSON.stringify(afterIds)) {
        throw new Error('Changing date did not change the matchday');
      }
      await hub.getByRole('button', { name: '上一比賽日' }).click();
      if ((await dates.nth(count - 2).getAttribute('aria-pressed')) !== 'true') {
        throw new Error('Previous-day navigation failed');
      }
      const followed = hub.locator('[data-matchday-followed]');
      await followed.click();
      if ((await followed.getAttribute('aria-pressed')) !== 'true') throw new Error('Favorite filter not activated');
      const teamMatches = await hub.locator('[data-matchday-match]').count();
      if (teamMatches > afterIds.length + 6) throw new Error('Favorite filter unexpectedly expanded matches');
      await followed.click();
      if ((await followed.getAttribute('aria-pressed')) !== 'false') throw new Error('Favorite filter not cleared');

      const firstMatch = hub.locator('[data-matchday-match]').first();
      const matchId = await firstMatch.getAttribute('data-matchday-match');
      await firstMatch.click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible' });
      if (!page.url().includes(encodeURIComponent(matchId))) {
        throw new Error('Opening a match did not update original URL');
      }
      await dialog.getByRole('button', { name: '關閉', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      if (await hub.count() !== 1) throw new Error('Explorer disappeared after closing dialog');
      const layout = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        viewport: window.innerWidth,
      }));
      if (layout.doc > width + 2 || layout.body > width + 2) {
        throw new Error('Horizontal overflow ' + JSON.stringify(layout));
      }
      if (errors.length) throw new Error('Browser JS errors: ' + errors.join(' | '));
      console.log('[matchday-explorer] PASS ' + width + 'px; dates=' + count);
    } catch (error) {
      failures.push(width + 'px: ' + error.message);
      console.error('[matchday-explorer] FAIL ' + width + 'px: ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error('[matchday-explorer] ' + failures.length + ' failed: ' + failures.join(' | '));
  process.exitCode = 1;
} else console.log('[matchday-explorer] PASS all responsive controls');
