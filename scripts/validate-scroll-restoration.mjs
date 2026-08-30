import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];
const allowedDelta = 24;

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

    const participants = page.locator('section[aria-labelledby="season-participants-title"]').first();
    await participants.waitFor({ state: 'visible' });

    const teamLink = participants.locator('a[aria-label^="查看 "][aria-label$=" 球隊頁"]').first();
    await teamLink.waitFor({ state: 'visible' });
    await teamLink.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 180), behavior: 'auto' });
    });
    await page.waitForTimeout(100);

    const ariaLabel = await teamLink.getAttribute('aria-label');
    if (!ariaLabel) fail(`${viewport.name}: team link is missing aria-label`);

    const beforeTop = await teamLink.evaluate((element) => element.getBoundingClientRect().top);
    const beforeScrollY = await page.evaluate(() => window.scrollY);

    await teamLink.click();
    await page.waitForURL(/#\/teams\//);
    await page.waitForSelector('#root > *');

    await page.goBack();
    await page.waitForURL(/#\/$/);
    await participants.waitFor({ state: 'visible' });

    await page.waitForFunction(
      ({ label, expectedTop, tolerance }) => {
        const link = [...document.querySelectorAll('a[aria-label]')]
          .find((element) => element.getAttribute('aria-label') === label);
        if (!(link instanceof HTMLElement)) return false;
        return Math.abs(link.getBoundingClientRect().top - expectedTop) <= tolerance;
      },
      { label: ariaLabel, expectedTop: beforeTop, tolerance: allowedDelta },
      { timeout: 6000 },
    );

    const restoredLink = participants.locator(`a[aria-label="${ariaLabel}"]`).first();
    const afterTop = await restoredLink.evaluate((element) => element.getBoundingClientRect().top);
    const afterScrollY = await page.evaluate(() => window.scrollY);
    const delta = Math.abs(afterTop - beforeTop);

    if (delta > allowedDelta) {
      fail(`${viewport.name}: returned ${delta.toFixed(1)}px away from the clicked team (before scroll ${beforeScrollY}, after ${afterScrollY})`);
    }

    console.log(`${viewport.name}: restored clicked team within ${delta.toFixed(1)}px`);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
console.log('Scroll restoration validation passed');