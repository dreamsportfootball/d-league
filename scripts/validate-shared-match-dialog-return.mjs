import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const cases = [
  { name: 'schedule', route: '/schedule?season=2026-27' },
  { name: 'team', route: '/teams/t_chen?season=2026-27' },
  { name: 'round', route: '/rounds/2026-27/L1/1' },
  { name: 'player', route: '/players/ch-03' },
];
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];
const browser = await chromium.launch({ headless: true });
const errors = [];
const matchParam = (page) =>
  new URLSearchParams(new URL(page.url()).hash.split('?')[1] ?? '').get('match');
const dialog = (page) => page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');

for (const viewport of viewports) {
  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    try {
      await page.goto(baseUrl + '/#' + testCase.route, { waitUntil: 'domcontentloaded' });
      const fallback = page.locator('[data-analytics-event="match_open"]:visible').first();
      await fallback.waitFor({ state: 'visible', timeout: 30000 });
      const preferred = page.locator('[data-analytics-event="match_open"][data-analytics-label="m2627-001"]:visible');
      const target = await preferred.count() > 0 ? preferred.first() : fallback;
      await target.scrollIntoViewIfNeeded();
      const expectedId = await target.getAttribute('data-analytics-label');
      if (!expectedId) throw Error('match ID missing');

      await target.click();
      await dialog(page).waitFor({ state: 'visible' });
      if (matchParam(page) !== expectedId) throw Error('opening dialog did not store selected match in URL');

      const player = dialog(page).locator('a[href*="/players/"]').first();
      await player.waitFor({ state: 'visible' });
      await player.click();
      await page.waitForURL((url) => new URL(url).hash.startsWith('#/players/'));
      const back = page.getByRole('button', { name: '返回上一頁' }).first();
      await back.click();
      await dialog(page).waitFor({ state: 'visible' });
      if (matchParam(page) !== expectedId) throw Error('profile return lost original match');
      if (!new URL(page.url()).hash.startsWith('#' + testCase.route.split('?')[0])) {
        throw Error('profile return lost source route');
      }
      if (await page.evaluate(() => document.body.style.overflow) !== 'hidden') {
        throw Error('restored match did not lock background');
      }

      await dialog(page).getByRole('button', { name: '關閉', exact: true }).click();
      await dialog(page).waitFor({ state: 'hidden' });
      if (matchParam(page)) throw Error('dialog close left match parameter in URL');
      if (await page.evaluate(() => document.body.style.overflow) === 'hidden') {
        throw Error('dialog close left background locked');
      }
      console.log('[shared-match-dialog-return] ' + viewport.name + '/' + testCase.name + ' passed');
    } catch (error) {
      errors.push(viewport.name + '/' + testCase.name + ': ' + error.message);
    } finally {
      await page.close();
      await context.close();
    }
  }
}
await browser.close();
if (errors.length > 0) {
  console.error('[shared-match-dialog-return] ' + errors.join('\n'));
  process.exitCode = 1;
}
