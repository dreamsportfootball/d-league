import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const expectedMessages = [
  '已有 12 支球隊完成正式報名',
  '2026/27 賽季持續接受報名中',
  'L1、L2、L3 各級別預計錄取 6 支球隊',
  '更新至 2026/06/27',
  '報名隊數不代表最終錄取結果',
];
const forbiddenMessages = ['10／18', '55.6%', '剩餘 8 隊', '名額即將額滿'];

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

    const progressSection = page.getByRole('region', { name: '賽季報名動態' });
    await progressSection.waitFor({ state: 'visible' });
    const text = (await progressSection.innerText()).replace(/\s+/g, ' ').trim();

    for (const expected of expectedMessages) {
      if (!text.includes(expected)) fail(`${route}: missing “${expected}”`);
    }

    for (const forbidden of forbiddenMessages) {
      if (text.includes(forbidden)) fail(`${route}: should not display “${forbidden}”`);
    }

    if ((await progressSection.getByRole('progressbar').count()) !== 0) {
      fail(`${route}: should not render a capacity progress bar`);
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (hasHorizontalOverflow) fail(`${route}: registration information causes horizontal overflow`);
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
