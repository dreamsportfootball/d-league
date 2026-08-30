import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];
const allowedDelta = 24;
const restoreTimeoutMs = 6000;

const fail = (message) => {
  throw new Error(`Scroll restoration validation failed: ${message}`);
};

const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

  try {
    await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *');

    const popupCloseButton = page.getByRole('button', { name: '關閉工作人員合作隊招募' }).last();
    if (await popupCloseButton.isVisible()) {
      await popupCloseButton.click();
    }

    const teamsSection = page.locator('#teams').first();
    await teamsSection.waitFor({ state: 'attached' });

    const teamLink = teamsSection.locator('a[aria-label^="查看 "][aria-label$=" 球隊頁"]').first();
    await teamLink.waitFor({ state: 'visible' });
    await teamLink.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 180), behavior: 'auto' });
    });
    await page.waitForTimeout(150);

    const ariaLabel = await teamLink.getAttribute('aria-label');
    if (!ariaLabel) fail(`${viewport.name}: team link is missing aria-label`);

    const anchorId = await teamLink.getAttribute('data-scroll-anchor-id');
    if (!anchorId) fail(`${viewport.name}: homepage team link is missing data-scroll-anchor-id`);

    const beforeTop = await teamLink.evaluate((element) => element.getBoundingClientRect().top);
    const beforeScrollY = await page.evaluate(() => window.scrollY);
    if (beforeScrollY < viewport.height) {
      fail(`${viewport.name}: test did not reach the homepage team section (scrollY=${beforeScrollY})`);
    }

    await teamLink.click();
    await page.waitForURL(/#\/teams\//);
    await page.waitForSelector('#root > *');

    await page.goBack();
    await page.waitForURL(/#\/$/);
    await teamsSection.waitFor({ state: 'attached' });

    const startedAt = Date.now();
    let restored = false;
    while (Date.now() - startedAt < restoreTimeoutMs) {
      const state = await page.evaluate(({ label, scrollAnchorId }) => {
        const identifiedLinks = [...document.querySelectorAll('a[data-scroll-anchor-id]')];
        const exactLink = identifiedLinks.find(
          (element) => element.getAttribute('data-scroll-anchor-id') === scrollAnchorId,
        );
        const fallbackLink = [...document.querySelectorAll('a[aria-label]')]
          .find((element) => element.getAttribute('aria-label') === label);
        const link = exactLink ?? fallbackLink;
        return {
          found: link instanceof HTMLElement,
          top: link instanceof HTMLElement ? link.getBoundingClientRect().top : null,
        };
      }, { label: ariaLabel, scrollAnchorId: anchorId });

      if (state.found && state.top !== null && Math.abs(state.top - beforeTop) <= allowedDelta) {
        restored = true;
        break;
      }
      await page.waitForTimeout(100);
    }

    const finalState = await page.evaluate(({ label, scrollAnchorId }) => {
      const identifiedLinks = [...document.querySelectorAll('a[data-scroll-anchor-id]')];
      const exactLink = identifiedLinks.find(
        (element) => element.getAttribute('data-scroll-anchor-id') === scrollAnchorId,
      );
      const fallbackLink = [...document.querySelectorAll('a[aria-label]')]
        .find((element) => element.getAttribute('aria-label') === label);
      const link = exactLink ?? fallbackLink;
      return {
        found: link instanceof HTMLElement,
        top: link instanceof HTMLElement ? link.getBoundingClientRect().top : null,
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        teamsTop: document.getElementById('teams')?.getBoundingClientRect().top ?? null,
      };
    }, { label: ariaLabel, scrollAnchorId: anchorId });

    if (!restored || finalState.top === null) {
      fail(`${viewport.name}: did not restore clicked team within ${allowedDelta}px; diagnostics=${JSON.stringify(finalState)}`);
    }

    const delta = Math.abs(finalState.top - beforeTop);
    console.log(`${viewport.name}: restored clicked team within ${delta.toFixed(1)}px`);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
console.log('Scroll restoration validation passed');
