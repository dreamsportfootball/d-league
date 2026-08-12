import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const expectedMessages = [
  '正式參賽隊伍',
  '正式分級公布於 2026/08/05',
  '共 18 隊',
  '本季共 18 支球隊完成參賽確認，L1、L2、L3 各 6 隊',
  '後續將進行球員及隊職員登錄審核、賽程編排與賽季資料建置',
  '球員及隊職員登錄截止',
  '2026/08/31 23:59 前',
];
const expectedTeams = [
  '南州陳公舘',
  '高雄黑騎士足球隊',
  '銅雀俱樂部',
  'Wanderers',
  '台南鳥仕足球俱樂部',
];
const forbiddenMessages = [
  '賽季持續接受報名中',
  '已有 13 支球隊完成正式報名',
  '10／18',
  '55.6%',
  '剩餘 8 隊',
  '名額即將額滿',
];

const fail = (message) => {
  throw new Error(`Season participants validation failed: ${message}`);
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

    const participantsSection = page.locator('section[aria-labelledby="season-participants-title"]').first();
    await participantsSection.waitFor({ state: 'visible', timeout: 12000 });
    const text = (await participantsSection.innerText()).replace(/\s+/g, ' ').trim();

    for (const expected of expectedMessages) {
      if (!text.includes(expected)) fail(`${route}: missing “${expected}”`);
    }

    for (const team of expectedTeams) {
      if (!text.includes(team)) fail(`${route}: missing confirmed team “${team}”`);
    }

    for (const forbidden of forbiddenMessages) {
      if (text.includes(forbidden)) fail(`${route}: should not display obsolete registration text “${forbidden}”`);
    }

    if ((await participantsSection.getByRole('progressbar').count()) !== 0) {
      fail(`${route}: should not render a registration-capacity progress bar after confirmed teams are published`);
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (hasHorizontalOverflow) fail(`${route}: confirmed participant information causes horizontal overflow`);
    if (pageErrors.length > 0) fail(`${route}: ${pageErrors.join(' | ')}`);
  } finally {
    await page.close();
  }
};

try {
  await validateRoute('/');
  await validateRoute('/registration');
  console.log('Season participants validation passed');
} finally {
  await context.close();
  await browser.close();
}
