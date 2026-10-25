import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

const openAt = async (timestamp, route) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date(timestamp) });
  await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'networkidle' });
  return { page, context };
};

try {
  const before = await openAt('2026-10-25T04:00:00Z', '/');
  const next = before.page.locator('section[aria-label="下一個比賽日"]');
  await next.waitFor({ state: 'visible' });
  assert((await next.innerText()).includes('6 場比賽'), 'next matchday count is not data-driven');
  assert((await next.innerText()).includes('2026.11.01'), 'next matchday date differs from official fixture data');
  assert(await next.locator('[data-matchday-fixture]').count() === 0,
    'non-matchday must remain a compact teaser');
  await before.context.close();

  const demo = await openAt('2026-10-25T04:00:00Z', '/?demo=matchday');
  const demoSection = demo.page.locator('section[aria-label="MATCHDAY 示範"]');
  await demoSection.waitFor({ state: 'visible' });
  assert((await demoSection.innerText()).includes('示範模式'),
    'demo page must be visibly labeled, not mistaken for live matchday');
  assert((await demoSection.innerText()).includes('2026.11.01'),
    'demo fixture date must be November 1, 2026');
  assert(await demoSection.locator('[data-matchday-fixture]').count() === 6,
    'preview-only demonstration must display all six opening fixtures');
  assert(await demoSection.getByText('賽果未登錄').count() === 6,
    'demo must not invent scores');
  await demoSection.getByRole('link', { name: '退出示範' }).click();
  await demo.page.locator('section[aria-label="下一個比賽日"]').waitFor({ state: 'visible' });
  assert(await demo.page.locator('section[aria-label="MATCHDAY 示範"]').count() === 0,
    'leaving demo must restore the real calendar mode');
  await demo.context.close();

  const today = await openAt('2026-11-01T00:30:00Z', '/');
  const matchday = today.page.locator('section[aria-label="今日比賽日資訊"]');
  await matchday.waitFor({ state: 'visible' });
  assert(await matchday.locator('[data-matchday-fixture]').count() === 6,
    'matchday must display all six official fixtures');
  assert(await matchday.getByText('賽果未登錄').count() === 6,
    'future scheduled matches must not be shown as live or finished');
  assert(await matchday.getByText('觀看已上架賽事影片').count() === 0,
    'do not invent match videos');
  await today.context.close();

  const stats = await openAt('2026-10-25T04:00:00Z', '/stats?season=2026-27');
  const hall = stats.page.locator('section[aria-labelledby="records-heading"]');
  await hall.waitFor({ state: 'visible' });
  assert((await hall.innerText()).includes('2025/26'), 'complete historical season reference missing');
  assert(await hall.locator('section[aria-label="L1 歷史紀錄"] > div.grid > div').count() === 5,
    'L1 historical records must have five verifiable categories');
  assert(await hall.locator('section[aria-label="L2 歷史紀錄"] > div.grid > div').count() === 5,
    'L2 historical records must have five verifiable categories');
  assert((await hall.innerText()).includes('尚無可統計紀錄'),
    'unplayed L3 must not show fabricated records');
  const textBefore = await hall.innerText();
  await stats.page.goto(`${baseUrl}/#/stats?season=2025-26`, { waitUntil: 'networkidle' });
  const textAfter = await hall.innerText();
  assert(textBefore === textAfter, 'season filter must not contaminate historical records hall');
  await stats.context.close();

  console.log('MATCHDAY and RECORDS behavior verified in desktop browser engine at 390px.');
} finally {
  await browser.close();
}
