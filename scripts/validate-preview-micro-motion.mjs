import { chromium } from 'playwright';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league/preview/season-2026-27').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const failures = [];
const configs = [
  { width: 375, motion: 'no-preference' },
  { width: 1280, motion: 'no-preference' },
  { width: 375, motion: 'reduce' },
  { width: 1280, motion: 'reduce' },
];

try {
  for (const { width, motion } of configs) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 812 : 900 },
      timezoneId: 'Asia/Taipei',
      locale: 'zh-TW',
      reducedMotion: motion,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const label = width + 'px/' + motion;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.setDefaultTimeout(16000);
    try {
      await page.goto(base + '/#/schedule?season=2026-27', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('[data-league-selector]').waitFor({ state: 'visible' });
      if (await page.locator('[data-matchday-navigator]').count()) {
        throw new Error('Rejected matchday explorer still present in schedule');
      }

      const trigger = page.locator('[data-league-selector] button[aria-haspopup="menu"]');
      await trigger.click();
      const menu = page.getByRole('menu', { name: '聯賽選項' });
      await menu.waitFor({ state: 'visible' });
      const menuAnimation = await menu.evaluate((node) => getComputedStyle(node).animationName);
      if (motion === 'no-preference' && !menuAnimation.includes('dleague-motion-menu-in')) {
        throw new Error('League dropdown missing lightweight entrance feedback: ' + menuAnimation);
      }
      if (motion === 'reduce' && menuAnimation !== 'none') {
        const duration = await menu.evaluate((node) => getComputedStyle(node).animationDuration);
        if (!duration.includes('0.01ms') && !duration.includes('1e-05s')) {
          throw new Error('Reduced motion not respected for menu: ' + menuAnimation + '/' + duration);
        }
      }
      if (await menu.getByRole('menuitemradio').count() < 2) throw new Error('League choices missing');
      await menu.getByRole('menuitemradio').last().click();
      await menu.waitFor({ state: 'hidden' });

      const row = page.locator('button[data-analytics-event="match_open"]:visible').first();
      await row.waitFor({ state: 'visible' });
      if (!(await row.getAttribute('class'))?.includes('dleague-motion-match-row')) {
        throw new Error('Match row feedback not installed');
      }
      await row.click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible' });
      const dialogAnimation = await dialog.evaluate((node) => getComputedStyle(node).animationName);
      if (motion === 'no-preference' && !dialogAnimation.includes('dleague-motion-dialog-in')) {
        throw new Error('Match dialog missing entrance feedback: ' + dialogAnimation);
      }
      await dialog.getByRole('button', { name: '關閉', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });

      await page.goto(base + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (await page.locator('[data-home-matchday-explorer], [data-matchday-navigator]').count()) {
        throw new Error('Rejected matchday explorer still present in homepage');
      }
      const card = page.locator('button.dleague-motion-match-card').first();
      await card.waitFor({ state: 'visible' });
      await card.click();
      await page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]').waitFor({ state: 'visible' });
      await page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]').getByRole('button', { name: '關閉', exact: true }).click();

      const dims = await page.evaluate(() => ({
        viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      }));
      if (dims.html > width + 3 || dims.body > width + 3) {
        throw new Error('Homepage horizontal overflow: ' + JSON.stringify(dims));
      }
      if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));
      console.log('[micro-motion] PASS ' + label + ' (no matchday explorer, controls operational)');
    } catch (error) {
      failures.push(label + ': ' + error.message);
      console.error('[micro-motion] FAIL ' + label + ': ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error('[micro-motion] FAILURES: ' + failures.join(' | '));
  process.exitCode = 1;
} else {
  console.log('[micro-motion] PASS all 4 responsive and reduced-motion modes');
}
