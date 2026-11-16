import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const fixtures = JSON.parse(await readFile(new URL('../data/seasons/2026-27/matches.json', import.meta.url), 'utf8'));
const nextMatch = fixtures.find((match) => match.status === 'SCHEDULED' && Date.parse(match.timestamp) > Date.now());
const widths = [375, 390, 768, 1024, 1280, 1440];
const browser = await chromium.launch({ headless: true });
const failures = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    reducedMotion: 'reduce',
    acceptDownloads: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(16000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' });
    const searchButton = page.getByRole('button', { name: '搜尋球隊、球員與比賽' });
    await searchButton.click();
    const search = page.getByRole('searchbox', { name: '搜尋球隊、球員與賽事' });
    await search.fill('林皓宇');
    const result = page.getByRole('link', { name: /林皓宇/ }).first();
    await result.waitFor({ state: 'visible' });
    await result.click();
    await page.locator('h1').filter({ hasText: '林皓宇' }).waitFor({ state: 'visible' });
    if (await page.getByRole('dialog', { name: '搜尋球隊、球員與賽事' }).count() !== 0) {
      throw new Error('search dialog remained open after result navigation');
    }

    // Multi-team follow: migrate old favourites, retain more than one team,
    // open each upcoming match as a homepage modal, and remove one at a time.
    await page.goto(base + '/#/teams/black-wolf-fc?season=2026-27', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^追蹤/ }).click();
    await page.getByRole('button', { name: /^取消追蹤/ }).waitFor({ state: 'visible' });

    await page.goto(base + '/#/teams/t_chen?season=2026-27', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^追蹤/ }).click();
    await page.getByRole('button', { name: /^取消追蹤/ }).waitFor({ state: 'visible' });

    const storedTeams = await page.evaluate(() => {
      const raw = window.localStorage.getItem('dleague:followed-teams:v2');
      return raw ? JSON.parse(raw) : null;
    });
    if (!Array.isArray(storedTeams) || storedTeams.length !== 2 || new Set(storedTeams).size !== 2) {
      throw new Error('following two teams did not persist two distinct IDs');
    }

    await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' });
    const spotlight = page.getByRole('region', { name: '追蹤球隊' });
    await spotlight.waitFor({ state: 'visible' });
    if (await spotlight.getByRole('button', { name: /^取消追蹤/ }).count() !== 2) {
      throw new Error('homepage must show both followed teams');
    }
    const matchLink = spotlight.locator('a[href*="?match="]').first();
    await matchLink.waitFor({ state: 'visible' });
    const scrollBeforeMatch = await page.evaluate(() => window.scrollY);
    await matchLink.click();
    const homeDialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
    await homeDialog.waitFor({ state: 'visible' });
    if (!new URL(page.url()).hash.startsWith('#/?match=')) {
      throw new Error('followed team match unexpectedly navigated away from homepage');
    }
    await homeDialog.getByRole('button', { name: '關閉', exact: true }).click();
    await homeDialog.waitFor({ state: 'hidden' });
    if (new URL(page.url()).hash !== '#/' ||
        Math.abs(await page.evaluate(() => window.scrollY) - scrollBeforeMatch) > 3) {
      throw new Error('closing followed match did not restore homepage and scroll');
    }
    if (await page.evaluate(() => document.body.style.overflow) === 'hidden') {
      throw new Error('closing followed match left background locked');
    }

    await spotlight.getByRole('button', { name: /^取消追蹤/ }).first().click();
    if (await spotlight.getByRole('button', { name: /^取消追蹤/ }).count() !== 1) {
      throw new Error('removing a followed team removed more than one team');
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await spotlight.waitFor({ state: 'visible' });
    if (await spotlight.getByRole('button', { name: /^取消追蹤/ }).count() !== 1) {
      throw new Error('remaining followed team was not restored after reload');
    }
    await spotlight.getByRole('button', { name: /^取消追蹤/ }).click();
    await spotlight.waitFor({ state: 'detached' });

    // Standalone shared match links have no previous in-app route and should
    // close to the appropriate season's schedule, not to an empty page.
    await page.goto(base + '/#/matches/m2627-019?season=2026-27', { waitUntil: 'domcontentloaded' });
    const standaloneMatch = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
    await standaloneMatch.waitFor({ state: 'visible' });
    await standaloneMatch.getByRole('button', { name: '關閉', exact: true }).click();
    await page.waitForURL((url) => url.hash.startsWith('#/schedule?season=2026-27'));
    await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' });

    await searchButton.click();
    await search.waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await search.waitFor({ state: 'detached' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 3) throw new Error('homepage horizontal overflow ' + overflow + ' px');

    await page.goto(base + '/#/standings?season=2026-27', { waitUntil: 'domcontentloaded' });
    const legend = page.getByLabel('升降級順位說明');
    await legend.waitFor({ state: 'visible' });
    if (!((await legend.textContent()) ?? '').includes('暫定降級區')) {
      throw new Error('league 1 provisional relegation legend absent');
    }

    await page.goto(base + '/#/media?season=2026-27', { waitUntil: 'domcontentloaded' });
    // The first image in the document is the always-visible header logo.
    // Wait for the lazy-loaded media route and its real gallery, not the logo.
    const gallery = page.getByRole('region', { name: '賽事相簿，可左右滑動瀏覽' });
    await gallery.waitFor({ state: 'visible' });
    await gallery.getByRole('button', { name: /查看.*相簿/ }).first().waitFor({ state: 'visible' });
    if (await gallery.getByText(/比賽日相簿|場比賽相簿/, { exact: false }).count() === 0) {
      throw new Error('editorial album cover label absent');
    }

    if (nextMatch) {
      await page.goto(base + '/#/schedule?season=2026-27&match=' + nextMatch.id, { waitUntil: 'domcontentloaded' });
      const calendar = page.getByRole('button', { name: '下載這場比賽的行事曆檔案' });
      await calendar.waitFor({ state: 'visible' });
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 12000 }),
        calendar.click(),
      ]);
      if (download.suggestedFilename() !== 'D-LEAGUE-' + nextMatch.id + '.ics') {
        throw new Error('unexpected calendar filename');
      }
      const content = await readFile(await download.path(), 'utf8');
      if (!content.includes('BEGIN:VCALENDAR') || !content.includes('UID:' + nextMatch.id) || !content.includes('DTSTART:') || content.includes('DTEND:')) {
        throw new Error('calendar must contain correct kickoff-only event');
      }
    }

    if (pageErrors.length) throw new Error('uncaught page error: ' + pageErrors.join(' | '));
    console.log('[fan-ux] ' + width + 'px PASS: search, multiple favourites, homepage match return, direct link fallback, keyboard, standings, media' + (nextMatch ? ', calendar' : ''));
  } catch (error) {
    failures.push(width + 'px: ' + error.message);
  } finally {
    await context.close();
  }
}
await browser.close();
if (failures.length) {
  failures.forEach((message) => console.error('[fan-ux] FAIL ' + message));
  process.exitCode = 1;
} else {
  console.log('[fan-ux] PASS: all six viewport widths');
}
