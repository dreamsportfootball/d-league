import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const expectedGroups = {
  A: ['東港足球隊', '東高 FC', '台南長青俱樂部', 'KAFC'],
  B: ['新年快快樂樂', 'TNSCF Eagles', '歹命打工人', 'Landen United'],
};

const fail = (message) => {
  throw new Error(`Cup page validation failed: ${message}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/#/cup`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('#root > *', { timeout: 12000 });
  await page.getByRole('heading', { name: '2026 台南夢達 新春賀歲盃' }).waitFor();

  const bodyText = await page.locator('body').innerText();
  if (!bodyText.includes('盃賽冠軍') || !bodyText.includes('東港足球隊')) {
    fail('cup champion is missing');
  }
  if (!bodyText.includes('決賽') || !bodyText.includes('2–1')) {
    fail('cup final score is missing');
  }

  for (const [group, expectedOrder] of Object.entries(expectedGroups)) {
    const section = page
      .getByRole('heading', { name: `${group} 組` })
      .locator('xpath=ancestor::section[1]');
    const rows = (await section.locator('li').allTextContents()).map((value) => value.trim());

    expectedOrder.forEach((teamName, index) => {
      if (!rows[index]?.includes(teamName)) {
        fail(`${group} group rank ${index + 1} expected ${teamName}, received ${rows[index] ?? 'missing'}`);
      }
    });
  }

  const routeBeforeClick = new URL(page.url()).hash;
  await page.getByRole('link', { name: /查看完整賽果/ }).click();
  await page.waitForTimeout(900);
  const routeAfterClick = new URL(page.url()).hash;

  if (routeAfterClick !== routeBeforeClick || routeAfterClick !== '#/cup') {
    fail(`results link changed route from ${routeBeforeClick} to ${routeAfterClick}`);
  }

  const resultsPosition = await page.locator('#results').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewportHeight: window.innerHeight };
  });
  if (resultsPosition.top >= resultsPosition.viewportHeight || resultsPosition.bottom <= 64) {
    fail(`results section is not visible after click: ${JSON.stringify(resultsPosition)}`);
  }

  const afterClickText = await page.locator('body').innerText();
  if (afterClickText.includes('找不到此頁面')) fail('results link rendered the 404 page');

  console.log('Cup page validation passed');
} finally {
  await context.close();
  await browser.close();
}
