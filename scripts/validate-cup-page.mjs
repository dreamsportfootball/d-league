import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const expectedGroups = {
  A: [
    { team: '東港足球隊', points: '9 分', goalDifference: '+10' },
    { team: '東高 FC', points: '4 分', goalDifference: '-2' },
    { team: '台南長青俱樂部', points: '3 分', goalDifference: '-1' },
    { team: 'KAFC', points: '1 分', goalDifference: '-7' },
  ],
  B: [
    { team: '新年快快樂樂', points: '9 分', goalDifference: '+13' },
    { team: 'TNSCF Eagles', points: '6 分', goalDifference: '+8' },
    { team: '歹命打工人', points: '3 分', goalDifference: '+2' },
    { team: 'Landen United', points: '0 分', goalDifference: '-23' },
  ],
};
const expectedKnockoutMatches = {
  13: ['台南長青俱樂部', '7–0', 'Landen United'],
  14: ['歹命打工人', '3–1', 'KAFC'],
  15: ['東港足球隊', '3–1', 'TNSCF Eagles'],
  16: ['新年快快樂樂', '6–1', '東高 FC'],
  17: ['台南長青俱樂部', '1–0', '歹命打工人'],
  18: ['Landen United', '1–1', 'KAFC', 'PK 1–3'],
  19: ['TNSCF Eagles', '2–0', '東高 FC'],
  20: ['東港足球隊', '2–1', '新年快快樂樂'],
};
const rankingRule = '小組排名依積分、相關球隊對戰成績、淨勝球、總進球數；全部相同以 PK 點球大戰決定';
const pairingRule = '小組前兩名進入盃賽：A1 對 B2、B1 對 A2；小組後兩名進入盤賽：A3 對 B4、B3 對 A4';

const fail = (message) => {
  throw new Error(`Cup page validation failed: ${message}`);
};

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

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

  const bodyText = normalizeText(await page.locator('body').innerText());
  if (!bodyText.includes('盃賽冠軍') || !bodyText.includes('東港足球隊')) {
    fail('cup champion is missing');
  }
  if (!bodyText.includes('決賽') || !bodyText.includes('2–1')) {
    fail('cup final score is missing');
  }
  if (!bodyText.includes(rankingRule)) fail('group ranking rule does not match the regulations');
  if (!bodyText.includes(pairingRule)) fail('semifinal pairing rule is missing');

  for (const [group, expectedOrder] of Object.entries(expectedGroups)) {
    const section = page.locator(`[data-cup-group="${group}"]`);
    const rows = (await section.locator('li').allTextContents()).map(normalizeText);

    expectedOrder.forEach((expected, index) => {
      const row = rows[index] ?? '';
      if (!row.includes(expected.team)) {
        fail(`${group} group rank ${index + 1} expected ${expected.team}, received ${row || 'missing'}`);
      }
      if (!row.includes(expected.points) || !row.includes(expected.goalDifference)) {
        fail(`${group} group ${expected.team} has incorrect points or goal difference: ${row}`);
      }
    });
  }

  for (const [matchId, expectedParts] of Object.entries(expectedKnockoutMatches)) {
    const matchText = normalizeText(await page.locator(`[data-cup-match-id="${matchId}"]`).innerText());
    expectedParts.forEach((part) => {
      if (!matchText.includes(part)) {
        fail(`match ${matchId} is missing ${part}: ${matchText}`);
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
