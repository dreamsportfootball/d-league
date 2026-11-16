import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const basePath = new URL(base).pathname;
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];
const browser = await chromium.launch({ headless: true });
const errors = [];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const matchDialog = (page) => page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(16000);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    try {
      await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 25000 });
      const card = page.locator('#match-center [data-analytics-event="match_open"]:visible').first();
      await card.waitFor({ state: 'visible', timeout: 25000 });
      await card.scrollIntoViewIfNeeded();
      const homeScroll = await page.evaluate(() => window.scrollY);
      await card.click();
      await matchDialog(page).waitFor({ state: 'visible' });
      const matchParam = new URL(page.url()).searchParams.get('match');
      assert(Boolean(matchParam), 'opening home match did not update the query');

      await matchDialog(page).getByRole('button', { name: '關閉', exact: true }).click();
      await matchDialog(page).waitFor({ state: 'hidden' });
      const closedHome = new URL(page.url());
      assert(closedHome.pathname === basePath + '/' && !closedHome.searchParams.has('match'),
        'closing home match did not restore homepage');
      assert(Math.abs(await page.evaluate(() => window.scrollY) - homeScroll) <= 3,
        'closing home match lost scroll position');
      assert(await page.evaluate(() => document.body.style.overflow) !== 'hidden',
        'closing home match left background locked');

      await page.goto(base + '/teams/black-wolf-fc?season=2026-27', {
        waitUntil: 'domcontentloaded', timeout: 25000,
      });
      const roster = page.getByRole('heading', { name: '球員名單', exact: true })
        .locator('xpath=ancestor::section[1]');
      await roster.waitFor({ state: 'visible' });
      assert((await roster.locator('a[href*="/players/"]').count()) > 0,
        'team page has no registered players');

      await page.goto(base + '/standings?season=2026-27', {
        waitUntil: 'domcontentloaded', timeout: 25000,
      });
      // The route is lazy-loaded: wait for its own confirmed controls, not
      // the already-visible shell <main> (which can still be empty).
      await page.getByRole('button', { name: '篩選積分榜' })
        .waitFor({ state: 'visible', timeout: 25000 });
      await page.getByText('排名與積分', { exact: true }).first()
        .waitFor({ state: 'visible' });

      // Open a genuinely standalone match link without prior in-app history.
      const directPage = await context.newPage();
      try {
        await directPage.goto(base + '/matches/m2627-019?season=2026-27', {
          waitUntil: 'domcontentloaded', timeout: 25000,
        });
        await matchDialog(directPage).waitFor({ state: 'visible' });
        await matchDialog(directPage).getByRole('button', { name: '關閉', exact: true }).click();
        await directPage.waitForURL((url) =>
          url.pathname === basePath + '/schedule' && url.searchParams.get('season') === '2026-27');
      } finally {
        await directPage.close();
      }
      assert(pageErrors.length === 0, 'browser JS errors: ' + pageErrors.join(' | '));
      console.log('[production-release] ' + viewport.name +
        ' PASS: home match modal, return/scroll, team roster, standings, direct match fallback');
    } catch (error) {
      const message = viewport.name + ': ' + error.message;
      errors.push(message);
      await mkdir('audit', { recursive: true });
      await page.screenshot({
        path: 'audit/production-release-' + viewport.name + '.png', fullPage: true,
      }).catch(() => {});
      console.error('[production-release] FAIL ' + message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (errors.length > 0) process.exitCode = 1;
else console.log('[production-release] PASS: both device sizes');
