import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const browser = await chromium.launch({ headless: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`${baseUrl}/#/standings?season=2025-26`, { waitUntil: 'networkidle' });
    assert(await page.locator('header a[href*="/registration"]').count() === 1,
      `[${width}] historical standings removed current registration navigation`);
    assert(await page.locator('footer a[href*="/registration"]').count() === 1,
      `[${width}] historical standings removed current footer registration navigation`);

    await page.goto(`${baseUrl}/#/registration`, { waitUntil: 'networkidle' });
    assert(new URL(page.url()).hash === '#/registration',
      `[${width}] registration route redirected unexpectedly`);

    await page.goto(`${baseUrl}/#/standings?season=2026-27`, { waitUntil: 'networkidle' });
    const preseason = page.locator('section[aria-label*="正式參賽隊伍"]');
    if (await preseason.count()) {
      assert(await preseason.locator('table').count() === 0,
        `[${width}] preseason view still uses a fake league table`);
      assert((await preseason.innerText()).includes('首輪賽果確認後更新'),
        `[${width}] preseason update explanation missing`);
    }

    await page.goto(`${baseUrl}/#/stats?season=2026-27`, { waitUntil: 'networkidle' });
    const tabs = page.locator('[role="tablist"] [role="tab"]');
    if ((await tabs.count()) > 1) {
      const first = tabs.first();
      await first.focus();
      await first.press('ArrowRight');
      assert(await tabs.nth(1).getAttribute('aria-selected') === 'true',
        `[${width}] tab keyboard selection failed`);
      assert(await tabs.nth(1).evaluate((element) => document.activeElement === element),
        `[${width}] keyboard focus did not follow selected tab`);
    }

    assert(errors.length === 0, `[${width}] page errors: ${errors.join(' | ')}`);
    await context.close();
  }

  const motionContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
  await motionPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const firstDot = motionPage.getByRole('button', { name: '前往第 1 張圖片' });
  await firstDot.waitFor({ state: 'visible', timeout: 12000 });
  const bounds = await firstDot.boundingBox();
  assert(Boolean(bounds && bounds.width >= 44 && bounds.height >= 44),
    'photo gallery navigation buttons are smaller than 44x44');
  assert(await motionPage.getByRole('button', { name: '暫停自動播放圖片' }).count() === 0,
    'reduced-motion preference did not disable automatic carousel motion');
  await motionContext.close();
  console.log('UI regression gates passed: season navigation, preseason, tabs, carousel touch target and reduced motion');
} finally {
  await browser.close();
}
