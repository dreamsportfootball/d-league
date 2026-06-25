import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const expectedText = '目前已收到 10 隊正式報名';
const expectedCount = '10／18';
const expectedUpdatedAt = '更新至 2026/06/25';
const expectedNote = '報名隊數不代表最終錄取結果';

const fail = (message) => {
  throw new Error(`Registration progress validation failed: ${message}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});

const validateRoute = async (route) => {
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *', { timeout: 12000 });

    const progressSection = page.getByRole('region', { name: '賽季報名進度' });
    await progressSection.waitFor({ state: 'visible' });
    const text = (await progressSection.innerText()).replace(/\s+/g, ' ').trim();

    for (const expected of [expectedText, expectedCount, expectedUpdatedAt, expectedNote]) {
      if (!text.includes(expected)) fail(`${route}: missing “${expected}”`);
    }

    const progressBar = progressSection.getByRole('progressbar');
    if ((await progressBar.getAttribute('aria-valuenow')) !== '10') {
      fail(`${route}: aria-valuenow is not 10`);
    }
    if ((await progressBar.getAttribute('aria-valuemax')) !== '18') {
      fail(`${route}: aria-valuemax is not 18`);
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (hasHorizontalOverflow) fail(`${route}: registration progress causes horizontal overflow`);
    if (pageErrors.length > 0) fail(`${route}: ${pageErrors.join(' | ')}`);
  } finally {
    await page.close();
  }
};

try {
  await validateRoute('/');
  await validateRoute('/registration');
  console.log('Registration progress validation passed');
} finally {
  await context.close();
  await browser.close();
}
