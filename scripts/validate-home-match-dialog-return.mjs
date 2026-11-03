import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];
const browser = await chromium.launch({ headless: true });
const failures = [];

const matchFromUrl = (page) => {
  const hash = new URL(page.url()).hash;
  return new URLSearchParams(hash.split('?')[1] ?? '').get('match');
};
const dialogFor = (page) => page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const dismissPopup = async (page) => {
  const closeButton = page.getByRole('button', { name: '關閉工作人員合作隊招募' }).last();
  if (await closeButton.isVisible().catch(() => false)) await closeButton.click();
};
const checkRestoredDialog = async (page, expectedId, label) => {
  await dialogFor(page).waitFor({ state: 'visible' });
  assert(matchFromUrl(page) === expectedId,
    label + ': expected ' + expectedId + ' after return, got ' + matchFromUrl(page));
  assert(await page.evaluate(() => document.body.style.overflow) === 'hidden',
    label + ': returning dialog did not lock background');
};

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    // Card -> team profile -> in-app back -> same dialog and scroll position.
    await page.goto(baseUrl + '/#/', { waitUntil: 'domcontentloaded' });
    await page.locator('#match-center').waitFor({ state: 'visible', timeout: 30000 });
    await dismissPopup(page);
    await page.locator('#match-center').getByRole('tab', { name: '最新賽果' }).click();
    const card = page.locator('#match-center [data-analytics-event="match_open"]').first();
    await card.scrollIntoViewIfNeeded();
    const cardId = await card.getAttribute('data-analytics-label');
    assert(Boolean(cardId), 'match card ID is missing');
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await card.click();
    await checkRestoredDialog(page, cardId, 'open home card');
    assert(Math.abs(await page.evaluate(() => window.scrollY) - beforeScroll) <= 2,
      'opening dialog scrolled homepage');

    await dialogFor(page).locator('a[href*="/teams/"]').first().click();
    await page.waitForURL((url) => new URL(url).hash.startsWith('#/teams/'));
    await page.getByRole('button', { name: '返回上一頁' }).first().click();
    await checkRestoredDialog(page, cardId, 'team profile back');
    assert(Math.abs(await page.evaluate(() => window.scrollY) - beforeScroll) <= 2,
      'team profile return lost homepage scroll position');
    await dialogFor(page).getByRole('button', { name: '關閉', exact: true }).click();
    await dialogFor(page).waitFor({ state: 'hidden' });
    assert(matchFromUrl(page) === null, 'closing dialog left match query behind');
    assert(Math.abs(await page.evaluate(() => window.scrollY) - beforeScroll) <= 2,
      'closing dialog scrolled homepage');

    // Known finished 2026/27 match with goal scorers. Check both website and
    // native browser back, including the player route's season-query redirect.
    const scorerMatchId = 'm2627-001';
    await page.goto(baseUrl + '/#/?match=' + scorerMatchId, { waitUntil: 'domcontentloaded' });
    await checkRestoredDialog(page, scorerMatchId, 'direct home match');
    const scorer = dialogFor(page).locator('a[href*="/players/"]').first();
    await scorer.waitFor({ state: 'visible' });
    await scorer.click();
    await page.waitForURL((url) => new URL(url).hash.startsWith('#/players/'));
    await page.getByRole('button', { name: '返回上一頁' }).first().click();
    await checkRestoredDialog(page, scorerMatchId, 'player profile back');

    await dialogFor(page).locator('a[href*="/players/"]').first().click();
    await page.waitForURL((url) => new URL(url).hash.startsWith('#/players/'));
    await page.goBack();
    await checkRestoredDialog(page, scorerMatchId, 'browser back');
    await dialogFor(page).getByRole('button', { name: '關閉', exact: true }).click();
    await dialogFor(page).waitFor({ state: 'hidden' });
    assert(matchFromUrl(page) === null, 'final close left match query behind');
    assert(await page.evaluate(() => document.body.style.overflow) !== 'hidden',
      'final close left background scroll locked');
    assert(errors.length === 0, 'browser errors: ' + errors.join(' | '));
    console.log('[home-match-dialog-return] ' + viewport.name + ' passed');
  } catch (error) {
    failures.push(viewport.name + ': ' + error.message);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
if (failures.length > 0) {
  console.error('Home match dialog return failed with ' + failures.length + ' issue(s):');
  failures.forEach((issue) => console.error('- ' + issue));
  process.exitCode = 1;
} else {
  console.log('Home match dialog return passed: ' + viewports.length + ' viewports');
}
