import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const playerRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://www.youtube-nocookie.com/embed/')) {
      playerRequests.push(request.url());
    }
  });

  try {
    await page.goto(baseUrl + '/#/schedule?season=2026-27&match=m2627-010', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
    await dialog.waitFor({ state: 'visible' });
    const first = dialog.getByRole('button', { name: '播放上半場比賽影片' });
    const second = dialog.getByRole('button', { name: '播放下半場比賽影片' });
    await first.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);

    if (await dialog.locator('iframe[src*="youtube-nocookie.com/embed/"]').count() !== 0 ||
        playerRequests.length !== 0) {
      throw new Error('YouTube iframe loaded simply by scrolling to the video section');
    }
    if (!(await second.isVisible())) {
      throw new Error('second-half video preview not available');
    }

    await first.click();
    const firstPlayer = dialog.locator('iframe[title="上半場比賽影片"]');
    await firstPlayer.waitFor({ state: 'attached' });
    const firstSrc = await firstPlayer.getAttribute('src');
    if (!firstSrc?.includes('Sw7P8yazc1s') || !firstSrc.includes('autoplay=1')) {
      throw new Error('unexpected first-half player: ' + firstSrc);
    }
    if (await dialog.locator('iframe[src*="youtube-nocookie.com/embed/"]').count() !== 1) {
      throw new Error('more than one YouTube player loaded on first click');
    }

    await dialog.getByRole('button', { name: '下一場' }).click();
    await dialog.getByRole('button', { name: '播放上半場比賽影片' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(100);
    if (await dialog.locator('iframe[src*="youtube-nocookie.com/embed/"]').count() !== 0) {
      throw new Error('video player stayed mounted after switching matches');
    }

    await page.getByRole('button', { name: '關閉比賽詳情' }).click({ position: { x: 4, y: 4 } });
    await dialog.waitFor({ state: 'hidden' });
    console.log('[match-video-on-demand] ' + viewport.name + ': preview only until play; match switch resets player');
  } catch (error) {
    failures.push(viewport.name + ': ' + error.message);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
if (failures.length) {
  failures.forEach((item) => console.error('[match-video-on-demand] FAIL ' + item));
  process.exitCode = 1;
} else {
  console.log('[match-video-on-demand] PASS (' + viewports.length + ' viewports)');
}
