import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\\/$/, '');
const outputDir = process.env.AUDIT_OUTPUT_DIR ?? 'mobile-match-center-audit';
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const issues = [];
const browser = await chromium.launch({ headless: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

await mkdir(outputDir, { recursive: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-11-02T12:00:00+08:00'));
      await page.goto(baseUrl + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const matchCenter = page.locator('#match-center');
      await matchCenter.waitFor({ state: 'visible', timeout: 30000 });
      await matchCenter.scrollIntoViewIfNeeded();
      const cards = matchCenter.locator('[data-analytics-event="match_open"]');
      await cards.first().waitFor({ state: 'visible', timeout: 20000 });
      assert(await cards.count() === 6, viewport.name + ': expected 6 latest result cards');

      const results = matchCenter.getByRole('tab', { name: '最新賽果' });
      const upcoming = matchCenter.getByRole('tab', { name: '即將開賽' });
      assert(await results.getAttribute('aria-selected') === 'true',
        viewport.name + ': result tab should be active on November 2');
      const tabBounds = await Promise.all([results, upcoming].map((tab) =>
        tab.boundingBox()));
      assert(tabBounds.every((box) => box && box.height >= 44),
        viewport.name + ': mobile tabs must have >= 44px hit areas');

      const carousel = matchCenter.locator('.snap-x');
      const centering = async (locator, label) => {
        const rect = await locator.boundingBox();
        const area = await carousel.boundingBox();
        assert(rect && area, viewport.name + ': ' + label + ' bounds unavailable');
        const offset = Math.abs(rect.x + rect.width / 2 - (area.x + area.width / 2));
        assert(offset <= 2, viewport.name + ': ' + label + ' is ' + offset.toFixed(2) + 'px off-center');
        assert(rect.x >= area.x - 1 && rect.x + rect.width <= area.x + area.width + 1,
          viewport.name + ': ' + label + ' clipped');
      };

      await carousel.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.first(), 'first result card');
      await carousel.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.last(), 'last result card');
      await page.screenshot({
        path: path.join(outputDir, viewport.name + '__results.png'),
        animations: 'disabled',
      });

      await upcoming.click();
      assert(await upcoming.getAttribute('aria-selected') === 'true',
        viewport.name + ': upcoming tab did not activate');
      await cards.first().waitFor({ state: 'visible' });
      assert(await cards.count() === 3, viewport.name + ': expected 3 upcoming matches on November 8');
      await carousel.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.first(), 'first upcoming card');

      await results.click();
      assert(await results.getAttribute('aria-selected') === 'true',
        viewport.name + ': result tab did not reactivate');
      assert(await cards.count() === 6, viewport.name + ': results not restored');
      const beforeScroll = await page.evaluate(() => window.scrollY);
      await cards.first().click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible' });
      const bounds = await dialog.boundingBox();
      assert(bounds && bounds.x >= -1 && bounds.x + bounds.width <= viewport.width + 1,
        viewport.name + ': match dialog overflows horizontally');
      assert(bounds.y >= -1 && bounds.y + bounds.height <= viewport.height + 1,
        viewport.name + ': match dialog exceeds viewport height');
      assert(await page.evaluate(() => document.body.style.overflow) === 'hidden',
        viewport.name + ': dialog did not lock background scrolling');
      await page.screenshot({
        path: path.join(outputDir, viewport.name + '__dialog.png'),
        animations: 'disabled',
      });
      await dialog.getByRole('button', { name: '關閉', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert(await page.evaluate(() => document.body.style.overflow) !== 'hidden',
        viewport.name + ': background scroll remains locked after closing dialog');
      const afterScroll = await page.evaluate(() => window.scrollY);
      assert(Math.abs(afterScroll - beforeScroll) <= 2,
        viewport.name + ': closing dialog moved page by ' + (afterScroll - beforeScroll) + 'px');
      assert(errors.length === 0, viewport.name + ': runtime errors: ' + errors.join(' | '));
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert(pageWidth <= viewport.width + 1, viewport.name + ': page horizontal overflow ' + pageWidth);
      console.log('[mobile-match-center] ' + viewport.name + ' passed');
    } catch (error) {
      issues.push(viewport.name + ': ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (issues.length) {
  issues.forEach((issue) => console.error('[mobile-match-center] ' + issue));
  process.exitCode = 1;
} else {
  console.log('[mobile-match-center] mobile carousels, tabs, dialogs and scroll position passed');
}
