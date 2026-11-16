import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const cases = [
  { viewport: { width: 390, height: 844 }, mode: 'baseline' },
  { viewport: { width: 390, height: 844 }, mode: 'no-backdrop-blur' },
  { viewport: { width: 390, height: 844 }, mode: 'no-youtube-iframes' },
  { viewport: { width: 1440, height: 1000 }, mode: 'baseline' },
  { viewport: { width: 1440, height: 1000 }, mode: 'no-backdrop-blur' },
  { viewport: { width: 1440, height: 1000 }, mode: 'no-youtube-iframes' },
];

const summaries = [];
for (const experiment of cases) {
  const context = await browser.newContext({
    viewport: experiment.viewport,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    await page.goto(baseUrl + '/#/?match=m2627-010', {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });
    await page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]').waitFor({
      state: 'visible',
      timeout: 15000,
    });
    const scroller = page.locator('[data-match-dialog-scroller]');
    const video = page.locator('[data-match-video-entry="上半場"]');
    await video.waitFor({ state: 'attached' });
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1900);

    if (experiment.mode === 'no-backdrop-blur') {
      await page.addStyleTag({ content: '[data-match-dialog-backdrop] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }' });
    }
    if (experiment.mode === 'no-youtube-iframes') {
      await page.evaluate(() => {
        for (const iframe of document.querySelectorAll('[data-match-dialog-scroller] iframe')) {
          iframe.remove();
        }
        const style = document.createElement('style');
        style.textContent = '[data-match-dialog-scroller] iframe { visibility: hidden !important; }';
        document.head.append(style);
      });
    }

    const state = await page.evaluate(() => {
      const scroller = document.querySelector('[data-match-dialog-scroller]');
      const video = document.querySelector('[data-match-video-entry="上半場"]');
      const scRect = scroller?.getBoundingClientRect();
      const videoRect = video?.getBoundingClientRect();
      return {
        scrollHeight: scroller?.scrollHeight,
        clientHeight: scroller?.clientHeight,
        videoY: videoRect?.y,
        scrollerBottom: scRect?.bottom,
        iframeCount: document.querySelectorAll('[data-match-dialog-scroller] iframe').length,
      };
    });

    const animation = await page.evaluate(async () => {
      const scroller = document.querySelector('[data-match-dialog-scroller]');
      if (!scroller) throw new Error('missing match scroll element');
      const total = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const start = Math.max(0, total * .10);
      const end = Math.min(total, start + Math.min(950, total - start));
      const durations = [];
      scroller.scrollTop = start;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      let previous = performance.now();
      for (let frame = 0; frame < 120; frame++) {
        await new Promise((resolve) => requestAnimationFrame((time) => {
          durations.push(time - previous);
          previous = time;
          scroller.scrollTop = start + (end - start) * frame / 119;
          resolve();
        }));
      }
      const sorted = durations.slice(1).sort((a, b) => a - b);
      return {
        p50Ms: +sorted[Math.floor(sorted.length * .5)].toFixed(2),
        p95Ms: +sorted[Math.floor(sorted.length * .95)].toFixed(2),
        maxMs: +sorted.at(-1).toFixed(2),
        over33Ms: sorted.filter((x) => x > 33).length,
        over50Ms: sorted.filter((x) => x > 50).length,
        sampledFrames: sorted.length,
      };
    });

    const iframe = page.locator('[data-match-video-entry="上半場"] iframe').first();
    const iframeVisible = await iframe.count() > 0;
    let wheel = null;
    if (iframeVisible) {
      await iframe.scrollIntoViewIfNeeded();
      const rect = await iframe.boundingBox();
      const scrollRect = await scroller.boundingBox();
      if (rect && scrollRect) {
        const y = Math.min(scrollRect.y + scrollRect.height - 20, Math.max(scrollRect.y + 30, rect.y + Math.min(rect.height * .5, 60)));
        const xMid = rect.x + rect.width * .5;
        await page.mouse.move(xMid, y);
        const before = await scroller.evaluate((el) => el.scrollTop);
        await page.mouse.wheel(0, 420);
        await page.waitForTimeout(350);
        const after = await scroller.evaluate((el) => el.scrollTop);
        const centerDelta = +(after - before).toFixed(1);
        await scroller.evaluate((el) => { el.scrollTop = Math.max(0, el.scrollTop - 500); });
        await page.mouse.move(scrollRect.x + 7, y);
        const gutterBefore = await scroller.evaluate((el) => el.scrollTop);
        await page.mouse.wheel(0, 420);
        await page.waitForTimeout(350);
        const gutterAfter = await scroller.evaluate((el) => el.scrollTop);
        wheel = { centerDelta, gutterDelta: +(gutterAfter - gutterBefore).toFixed(1) };
      }
    }

    const result = {
      viewport: experiment.viewport.width,
      mode: experiment.mode,
      state,
      animation,
      wheel,
    };
    summaries.push(result);
    console.log('[match-scroll-diagnostic] ' + JSON.stringify(result));
  } catch (error) {
    console.error('[match-scroll-diagnostic] failed ' + experiment.viewport.width + ' ' + experiment.mode + ': ' + error.message);
  } finally {
    await page.close();
    await context.close();
  }
}
await browser.close();

console.log('[match-scroll-diagnostic-summary] ' + JSON.stringify(summaries));
