import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league/preview/football-app').replace(/\/$/, '');
const sizes = [320, 375, 390, 414, 768, 1024, 1280, 1440];
const browser = await chromium.launch({ headless: true });
const failures = [];

const assert = (ok, description) => { if (!ok) throw new Error(description); };
async function inspectViewport(page, width, context) {
  await page.goto(base + '/#/design-preview/football-app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('heading', { name: '賽程與賽果' }).waitFor({ state: 'visible', timeout: 30000 });
  assert(await page.locator('.fap-app').count() === 1, 'preview app missing');
  assert(await page.locator('.fap-header').count() === 1, 'preview own header missing');
  assert(await page.locator('[data-site-view-count-bar]').count() === 0, 'legacy layout leaked into isolated preview');
  assert(await page.locator('.fap-pill-tabs button').count() === 3, 'L1/L2/L3 selection missing');
  const selected = await page.locator('.fap-pill-tabs button').first().evaluate((button) => {
    const heading = document.querySelector('.fap-league-label');
    const text = button.querySelector(window.innerWidth < 741 ? '.fap-mobile-league' : '.fap-desktop-league');
    return { height: button.getBoundingClientRect().height, label: parseFloat(getComputedStyle(heading).fontSize), buttonText: parseFloat(getComputedStyle(text).fontSize) };
  });
  assert(selected.height >= 44, 'league button hit area must be >=44px: ' + JSON.stringify(selected));
  assert(selected.buttonText < selected.label, 'league label size should be smaller than 選擇聯賽');
  assert(await page.locator('.fap-match-row').count() > 0, 'no fixture cards');
  await assertNoOverflow(page, width, 'initial');

  if (width === 390 || width === 1280) {
    await page.evaluate(() => document.fonts.ready);
    await mkdir('dist', { recursive: true });
    await page.screenshot({ path: 'dist/football-app-' + (width === 390 ? 'mobile' : 'desktop') + '.png', fullPage: true });
  }

  await page.locator('.fap-pill-tabs button').nth(1).click();
  assert(await page.locator('.fap-pill-tabs button').nth(1).getAttribute('aria-pressed') === 'true', 'league switch not reflected');
  assert((await page.locator('.fap-paper-top').innerText()).includes('LEAGUE 2'), 'league switch did not update list');
  await assertNoOverflow(page, width, 'L2');

  await page.locator('.fap-main-tabs button').nth(1).click();
  await page.getByRole('heading', { name: '聯賽積分榜' }).waitFor({ state: 'visible' });
  assert(await page.locator('.fap-standing-row').count() > 0, 'standings rows missing');
  await assertNoOverflow(page, width, 'standings');

  await page.locator('.fap-main-tabs button').nth(2).click();
  await page.getByRole('heading', { name: '球員數據' }).waitFor({ state: 'visible' });
  assert(await page.locator('.fap-player-row').count() > 0, 'player rows missing');
  await page.locator('.fap-player-row').first().click();
  assert(await page.locator('.fap-profile').count() === 1, 'player detail missing');
  await assertNoOverflow(page, width, 'player profile');

  await page.locator('.fap-main-tabs button').nth(3).click();
  assert(await page.locator('.fap-team-card').count() > 0, 'team directory missing');
  await page.locator('.fap-team-card').first().click();
  assert(await page.locator('.fap-team-hero').count() === 1, 'team profile missing');
  await assertNoOverflow(page, width, 'team');

  await page.locator('.fap-main-tabs button').first().click();
  await page.locator('.fap-match-row').first().click();
  assert(await page.locator('.fap-scoreboard').count() === 1, 'match scoreboard missing');
  const official = page.locator('a.fap-official-link');
  assert((await official.first().getAttribute('href')).startsWith('https://dreamsportfootball.github.io/d-league/matches/'), 'official match route does not point to official site');
  await assertNoOverflow(page, width, 'match details');

  const errors = context.errors;
  assert(errors.length === 0, 'uncaught browser errors: ' + errors.join(' | '));
}
async function assertNoOverflow(page, width, label) {
  const state = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, body: document.body.scrollWidth, viewport: window.innerWidth }));
  assert(state.document <= state.viewport + 2 && state.body <= state.viewport + 2, label + ' horizontal overflow at ' + width + ': ' + JSON.stringify(state));
}
try {
  for (const width of sizes) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      locale: 'zh-TW', timezoneId: 'Asia/Taipei',
      reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const errors = [];
    page.setDefaultTimeout(18000);
    page.on('pageerror', error => errors.push(error.message));
    try {
      await inspectViewport(page, width, { errors });
      console.log('[football-preview] PASS ' + width + 'px');
    } catch (error) {
      failures.push(width + 'px: ' + error.message);
      await mkdir('audit', { recursive: true });
      await page.screenshot({ path: 'audit/football-preview-' + width + '-failure.png', fullPage: true }).catch(() => {});
      console.error('[football-preview] FAIL ' + width + 'px: ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error('[football-preview] ' + failures.length + ' viewport(s) failed: ' + failures.join(' | '));
  process.exitCode = 1;
} else console.log('[football-preview] PASS: responsive, data routes, official links and accessibility baseline');
