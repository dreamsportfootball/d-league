import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const viewports = [{ name: 'mobile-375', width: 375, height: 812 }, { name: 'desktop-1280', width: 1280, height: 900 }];
const scenarios = [
  { name: 'schedule-cross-league', path: '/schedule?season=2026-27&match=m2627-003', start: 'm2627-003', next: 'm2627-004' },
  { name: 'schedule-cross-matchday', path: '/schedule?season=2026-27&match=m2627-006', start: 'm2627-006', next: 'm2627-007' },
  { name: 'standalone-cross-league', path: '/matches/m2627-003', start: 'm2627-003', next: 'm2627-004', direct: true },
  { name: 'historical-cross-league', path: '/schedule?season=2025-26&match=m2', start: 'm2', next: 'm3' },
  { name: 'home-cross-matchday', path: '/', start: 'm2627-006', next: 'm2627-007', home: true },
];
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'zh-TW', timezoneId: 'Asia/Taipei', reducedMotion: 'reduce', serviceWorkers: 'block',
      });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        await page.goto(baseUrl + '/#' + scenario.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (scenario.home) {
          const card = page.locator('[data-analytics-event="match_open"][data-analytics-label="' + scenario.start + '"]');
          await card.waitFor({ state: 'visible' });
          await card.click();
        }
        const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
        await dialog.waitFor({ state: 'visible' });
        const next = dialog.getByRole('button', { name: '下一場' });
        const prev = dialog.getByRole('button', { name: '上一場' });
        if (!(await next.isEnabled())) throw new Error('next is disabled');
        await next.click();
        if (scenario.direct) {
          await page.waitForURL((url) => url.hash.includes('/matches/' + scenario.next));
        } else if (!scenario.home) {
          await page.waitForURL((url) => url.hash.includes('match=' + scenario.next));
        } else {
          await page.waitForFunction(() => {
            const d = document.querySelector('[role="dialog"][aria-labelledby="match-dialog-title"]');
            return d?.textContent?.includes('11/08') && d?.textContent?.includes('L3');
          });
        }
        if (!(await prev.isEnabled())) throw new Error('previous is disabled');
        await prev.click();
        if (scenario.direct) {
          await page.waitForURL((url) => url.hash.includes('/matches/' + scenario.start));
        } else if (!scenario.home) {
          await page.waitForURL((url) => url.hash.includes('match=' + scenario.start));
        } else {
          await page.waitForFunction(() => {
            const d = document.querySelector('[role="dialog"][aria-labelledby="match-dialog-title"]');
            return d?.textContent?.includes('11/01') && d?.textContent?.includes('L2');
          });
        }
        if (scenario.name === 'historical-cross-league' && !page.url().includes('2025-26')) {
          throw new Error('historical season changed');
        }
        console.log('[match-navigation] ' + viewport.name + ' / ' + scenario.name + ' passed');
      } catch (error) {
        failures.push(viewport.name + ' / ' + scenario.name + ': ' + error.message);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  failures.forEach((message) => console.error('[match-navigation] ' + message));
  process.exitCode = 1;
} else {
  console.log('[match-navigation] passed cross-league, cross-date, historical and homepage cases.');
}
