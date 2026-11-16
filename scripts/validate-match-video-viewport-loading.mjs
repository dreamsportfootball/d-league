import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const viewports = [
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    // The 7–4 match contains enough event rows to keep videos below the fold.
    await page.goto(baseUrl + '/#/schedule?season=2026-27&match=m2627-011', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
    await dialog.waitFor({ state: 'visible' });

    // Full-screen backdrop blur was measured as the dominant scroll
    // bottleneck on desktop; keep the dark overlay but never reintroduce blur.
    const blur = await page.locator('[data-match-dialog-backdrop]')
      .evaluate((element) => getComputedStyle(element).backdropFilter);
    if (blur !== 'none') {
      throw new Error('match dialog backdrop blur must be disabled: ' + blur);
    }

    const scroller = dialog.locator('[data-match-dialog-scroller]');
    const first = dialog.locator('[data-match-video-entry="上半場"]');
    const second = dialog.locator('[data-match-video-entry="下半場"]');
    await first.waitFor({ state: 'attached' });
    await second.waitFor({ state: 'attached' });
    await scroller.evaluate((element) => { element.scrollTop = 0; });

    const belowFold = await first.evaluate((element) => {
      const root = element.closest('[data-match-dialog-scroller]');
      if (!root) return false;
      return element.getBoundingClientRect().top > root.getBoundingClientRect().bottom + 25;
    });

    if (belowFold) {
      // Native loading="lazy" could fetch early; this change must not.
      await page.waitForTimeout(1500);
      if (await dialog.locator('iframe[title$="比賽影片"]').count() !== 0) {
        throw new Error('offscreen YouTube iframe mounted before the video is visible');
      }
    }

    await first.scrollIntoViewIfNeeded();
    const firstFrame = dialog.locator('iframe[title="上半場比賽影片"]');

    // Continuous scrolling must postpone iframe initialization, rather than
    // spawning a heavyweight YouTube player in the middle of a gesture.
    if (await firstFrame.count() === 0) {
      await page.evaluate(async () => {
        const root = document.querySelector('[data-match-dialog-scroller]');
        if (!root) throw new Error('missing dialog scroll area');
        for (let i = 0; i < 9; i++) {
          root.dispatchEvent(new Event('scroll'));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      });
      if (await firstFrame.count() !== 0) {
        throw new Error('YouTube iframe mounted during continuous scrolling');
      }
    }

    await firstFrame.waitFor({ state: 'attached', timeout: 10000 });
    const firstSrc = await firstFrame.getAttribute('src');
    if (!firstSrc?.includes('/embed/FoaBl60_aqg')) {
      throw new Error('unexpected first-half URL: ' + firstSrc);
    }

    await second.scrollIntoViewIfNeeded();
    const secondFrame = dialog.locator('iframe[title="下半場比賽影片"]');
    await secondFrame.waitFor({ state: 'attached', timeout: 10000 });
    const secondSrc = await secondFrame.getAttribute('src');
    if (!secondSrc?.includes('/embed/xsDp4TjSso0')) {
      throw new Error('unexpected second-half URL: ' + secondSrc);
    }

    // Changing match must not retain the previous match's loaded embeds.
    await dialog.getByRole('button', { name: '下一場' }).click();
    await page.waitForFunction(() => window.location.hash.includes('match=m2627-012'));
    // Both previous embeds can be present together. A multi-match locator
    // cannot use waitFor() in strict mode; require the whole set to disappear.
    await page.waitForFunction(() => {
      const activeDialog = document.querySelector('[role="dialog"][aria-labelledby="match-dialog-title"]');
      return activeDialog?.querySelectorAll('iframe[src*="FoaBl60_aqg"], iframe[src*="xsDp4TjSso0"]').length === 0;
    }, null, { timeout: 10000 });
    if (errors.length) throw new Error('page errors: ' + errors.join(' | '));

    console.log('[video-viewport-loading] ' + viewport.name + 'px: passed' + (belowFold ? ' offscreen delay, ' : ' ') + 'both halves and match switch');
  } catch (error) {
    failures.push(viewport.name + 'px: ' + error.message);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
if (failures.length) {
  failures.forEach((failure) => console.error('[video-viewport-loading] FAIL ' + failure));
  process.exitCode = 1;
} else {
  console.log('[video-viewport-loading] PASS: ' + viewports.length + ' viewports');
}
