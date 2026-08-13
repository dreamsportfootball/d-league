import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const outputDir = process.env.AUDIT_OUTPUT_DIR ?? 'visual-audit';
const targetRoute = '/rounds/2025-26/L1/1';

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/#${targetRoute}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('#root > *', { timeout: 12000 });
  await page.waitForTimeout(500);

  const diagnostics = await page.evaluate(() => ({
    bodyText: document.body.innerText,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    matchButtons: document.querySelectorAll('main [data-analytics-event="match_open"]').length,
    legacyMatchLinks: document.querySelectorAll('main a[href*="/matches/"]').length,
  }));

  const failures = [];
  if (!page.url().includes('#/rounds/2025-26/L1/1')) failures.push(`unexpected URL: ${page.url()}`);
  if (!diagnostics.bodyText.includes('2025/26 L1 第 1 輪')) failures.push('round title missing');
  if (!diagnostics.bodyText.includes('本輪賽程與賽果')) failures.push('round schedule missing');
  if (diagnostics.bodyText.includes('本輪數據洞察')) failures.push('removed round insights are still visible');
  if (diagnostics.matchButtons < 1) failures.push(`match dialog buttons missing: ${diagnostics.matchButtons}`);
  if (diagnostics.legacyMatchLinks > 0) failures.push(`legacy match links still exposed: ${diagnostics.legacyMatchLinks}`);
  if (diagnostics.documentWidth > diagnostics.viewportWidth + 1) {
    failures.push(`horizontal overflow: ${diagnostics.documentWidth}/${diagnostics.viewportWidth}`);
  }
  if (pageErrors.length > 0) failures.push(`page errors: ${pageErrors.join(' | ')}`);

  if (diagnostics.matchButtons > 0) {
    await page.locator('[data-analytics-event="match_open"]:visible').first().click();
    await page.waitForTimeout(250);
    const dialogVisible = (await page.locator('[role="dialog"]').count()) > 0;
    if (!dialogVisible) failures.push('match dialog did not open');
    if (!page.url().includes('#/rounds/2025-26/L1/1')) {
      failures.push(`round URL changed after opening dialog: ${page.url()}`);
    }
  }

  await page.screenshot({
    path: path.join(outputDir, 'round-entity-page.png'),
    fullPage: true,
    animations: 'disabled',
  });

  if (failures.length > 0) throw new Error(failures.join('; '));
  console.log(`Round page validation passed: matchButtons=${diagnostics.matchButtons}`);
} finally {
  await page.close();
  await context.close();
  await browser.close();
}
