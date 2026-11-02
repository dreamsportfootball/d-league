import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const scenarios = [
  { date: '2026-11-01', expected: 'Results' },
  { date: '2026-11-02', expected: 'Results' },
  { date: '2026-11-04', expected: 'Results' },
  { date: '2026-11-05', expected: 'Upcoming' },
];
const browser = await chromium.launch({ headless: true });
const issues = [];

const assertActive = async (page, expected, description) => {
  const name = expected === 'Results' ? '最新賽果' : '即將開賽';
  const tab = page.getByRole('tab', { name });
  await tab.waitFor({ state: 'visible' });
  if (await tab.getAttribute('aria-selected') !== 'true') {
    throw Error(description + ': expected active "' + name + '"');
  }
};

try {
  for (const viewport of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'desktop-1280', width: 1280, height: 900 },
  ]) {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        timezoneId: 'Asia/Taipei',
        locale: 'zh-TW',
        serviceWorkers: 'block',
      });
      try {
        const page = await context.newPage();
        await page.clock.install({ time: new Date(scenario.date + 'T12:00:00+08:00') });
        await page.goto(baseUrl + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await assertActive(page, scenario.expected, viewport.name + ' / ' + scenario.date);
        console.log('[home-match-center] ' + viewport.name + ' / ' + scenario.date + ' passed');
      } catch (error) {
        issues.push(viewport.name + ' / ' + scenario.date + ': ' + error.message);
      } finally {
        await context.close();
      }
    }
  }

  // Manual selection is preserved while navigating, but not allowed to
  // override a later day's automatically recommended tab.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, locale: 'zh-TW',
    timezoneId: 'Asia/Taipei', serviceWorkers: 'block',
  });
  try {
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-11-02T12:00:00+08:00') });
    await page.goto(baseUrl + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await assertActive(page, 'Results', 'manual selection setup');
    await page.getByRole('tab', { name: '即將開賽' }).click();
    await assertActive(page, 'Upcoming', 'manual choice');
    await page.goto(baseUrl + '/#/schedule?season=2026-27');
    await page.goto(baseUrl + '/#/');
    await assertActive(page, 'Upcoming', 'return to home on same day');
    await page.clock.setFixedTime(new Date('2026-11-03T12:00:00+08:00'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertActive(page, 'Results', 'manual choice expires after Taipei date changes');
  } catch (error) {
    issues.push('manual selection persistence: ' + error.message);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}

if (issues.length) {
  issues.forEach((issue) => console.error('[home-match-center] ' + issue));
  process.exitCode = 1;
} else {
  console.log('[home-match-center] Taipei three-day default and manual tab behavior passed.');
}
