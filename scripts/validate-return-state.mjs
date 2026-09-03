import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const currentSeason = '2026-27';
const historicalSeason = '2025-26';
const allowedDelta = 24;
const restoreTimeoutMs = 6000;

const fail = (message) => {
  throw new Error(`Return-state validation failed: ${message}`);
};

const waitForAnchorRestore = async (page, anchorId, expectedTop, label) => {
  const startedAt = Date.now();
  let finalTop = null;

  while (Date.now() - startedAt < restoreTimeoutMs) {
    finalTop = await page.evaluate((id) => {
      const element = [...document.querySelectorAll('a[data-scroll-anchor-id]')]
        .find((candidate) => candidate.getAttribute('data-scroll-anchor-id') === id);
      return element instanceof HTMLElement ? element.getBoundingClientRect().top : null;
    }, anchorId);

    if (finalTop !== null && Math.abs(finalTop - expectedTop) <= allowedDelta) return;
    await page.waitForTimeout(100);
  }

  fail(`${label}: anchor ${anchorId} was not restored (before=${expectedTop}, after=${finalTop})`);
};

const positionAnchor = async (page, locator, offset = 180) => {
  await locator.evaluate((element, requestedOffset) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - requestedOffset), behavior: 'auto' });
  }, offset);
  await page.waitForTimeout(150);
};

const browser = await chromium.launch({ headless: true });

try {
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/stats?season=${historicalSeason}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      await page.evaluate(() => {
        sessionStorage.removeItem('statsActiveTab');
        sessionStorage.removeItem('statsActiveLeague');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });

      const cardsTab = page.getByRole('tab', { name: '紅黃牌' });
      await cardsTab.click();
      if ((await cardsTab.getAttribute('aria-selected')) !== 'true') {
        fail('stats: red/yellow cards tab did not become active');
      }

      const playerLink = page.locator('a[data-scroll-anchor-id^="stats-player-"][href*="/players/"]:visible').first();
      await playerLink.waitFor({ state: 'visible' });
      await positionAnchor(page, playerLink, 190);
      const anchorId = await playerLink.getAttribute('data-scroll-anchor-id');
      if (!anchorId) fail('stats: player link has no scroll anchor id');
      const beforeTop = await playerLink.evaluate((element) => element.getBoundingClientRect().top);

      await playerLink.click();
      await page.waitForURL(/#\/players\//);
      const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
      await backButton.waitFor({ state: 'visible' });
      await backButton.click();
      await page.waitForURL((url) => url.hash.startsWith(`#/stats?season=${historicalSeason}`));

      const restoredCardsTab = page.getByRole('tab', { name: '紅黃牌' });
      if ((await restoredCardsTab.getAttribute('aria-selected')) !== 'true') {
        fail('stats: returning from player reset the active tab');
      }
      await waitForAnchorRestore(page, anchorId, beforeTop, 'stats player return');
    } finally {
      await page.close();
      await context.close();
    }
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      await page.evaluate(() => sessionStorage.removeItem('dleague:home-standings-league'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      const standingsSection = page.locator('#standings-and-news');
      await standingsSection.waitFor({ state: 'attached' });
      const l2Tab = standingsSection.getByRole('tab', { name: 'L2' });
      await l2Tab.waitFor({ state: 'visible' });
      await l2Tab.click();
      if ((await l2Tab.getAttribute('aria-selected')) !== 'true') {
        fail('home standings: L2 did not become active');
      }

      const teamLink = standingsSection.locator(`a[data-scroll-anchor-id^="home-standings-${currentSeason}-L2-"]:visible`).first();
      await teamLink.waitFor({ state: 'visible' });
      await teamLink.click();
      await page.waitForURL(/#\/teams\//);
      const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
      await backButton.waitFor({ state: 'visible' });
      await backButton.click();
      await page.waitForURL((url) => url.hash === '#/');

      const restoredL2Tab = page.locator('#standings-and-news').getByRole('tab', { name: 'L2' });
      await restoredL2Tab.waitFor({ state: 'visible' });
      if ((await restoredL2Tab.getAttribute('aria-selected')) !== 'true') {
        fail('home standings: returning from team reset the active league to L1');
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/standings?season=${currentSeason}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      await page.evaluate(() => sessionStorage.setItem('standingsActiveLeague', 'L1'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      const teamLink = page.locator(`a[data-scroll-anchor-id^="preseason-standings-team-${currentSeason}-L1-"]:visible`).first();
      await teamLink.waitFor({ state: 'visible' });
      await positionAnchor(page, teamLink, 190);
      const anchorId = await teamLink.getAttribute('data-scroll-anchor-id');
      if (!anchorId) fail('current preseason standings: team link has no scroll anchor id');
      const beforeTop = await teamLink.evaluate((element) => element.getBoundingClientRect().top);

      await teamLink.click();
      await page.waitForURL(/#\/teams\//);
      const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
      await backButton.waitFor({ state: 'visible' });
      await backButton.click();
      await page.waitForURL((url) => url.hash.startsWith(`#/standings?season=${currentSeason}`));
      await waitForAnchorRestore(page, anchorId, beforeTop, 'current preseason standings team return');
    } finally {
      await page.close();
      await context.close();
    }
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/standings?season=${historicalSeason}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      await page.evaluate(() => {
        sessionStorage.removeItem('standingsMobileExpanded');
        sessionStorage.setItem('standingsActiveLeague', 'L1');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });

      const expandButton = page.getByRole('button', { name: '查看完整數據 ↓' });
      await expandButton.click();
      const collapseButton = page.getByRole('button', { name: '收起數據 ↑' });
      if ((await collapseButton.getAttribute('aria-expanded')) !== 'true') {
        fail('standings: mobile full-data table did not expand');
      }

      const teamLink = page.locator('a[data-scroll-anchor-id^="standings-team-mobile-expanded-"]:visible').first();
      await teamLink.waitFor({ state: 'visible' });
      await positionAnchor(page, teamLink, 190);
      const anchorId = await teamLink.getAttribute('data-scroll-anchor-id');
      if (!anchorId) fail('standings: expanded team link has no scroll anchor id');
      const beforeTop = await teamLink.evaluate((element) => element.getBoundingClientRect().top);

      await teamLink.click();
      await page.waitForURL(/#\/teams\//);
      const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
      await backButton.waitFor({ state: 'visible' });
      await backButton.click();
      await page.waitForURL((url) => url.hash.startsWith(`#/standings?season=${historicalSeason}`));

      const restoredCollapseButton = page.getByRole('button', { name: '收起數據 ↑' });
      if ((await restoredCollapseButton.getAttribute('aria-expanded')) !== 'true') {
        fail('standings: returning from team collapsed the mobile full-data table');
      }
      await waitForAnchorRestore(page, anchorId, beforeTop, 'standings team return');
    } finally {
      await page.close();
      await context.close();
    }
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/schedule?season=${historicalSeason}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      await page.evaluate((seasonId) => {
        sessionStorage.removeItem(`dleague:schedule-filters:${seasonId}`);
      }, historicalSeason);
      await page.reload({ waitUntil: 'domcontentloaded' });

      const desktopFilterButton = page.locator('button[aria-controls="desktop-schedule-filters"]');
      await desktopFilterButton.click();
      await page.getByRole('button', { name: /^聯賽級別/ }).click();
      const l2Option = page.getByRole('radio', { name: /^(L2|LEAGUE 2)$/ });
      await l2Option.click();
      const applyButton = page.getByRole('button', { name: /^顯示 \d+ 場$/ });
      await applyButton.click();

      const storedLeague = await page.evaluate((seasonId) => {
        const raw = sessionStorage.getItem(`dleague:schedule-filters:${seasonId}`);
        if (!raw) return null;
        const value = JSON.parse(raw);
        return typeof value?.league === 'string' ? value.league : null;
      }, historicalSeason);
      if (storedLeague !== 'L2') fail(`schedule: expected stored L2 filter, got ${storedLeague}`);

      await page.goto(`${baseUrl}/#/stats?season=${historicalSeason}`, { waitUntil: 'domcontentloaded' });
      await page.goBack();
      await page.waitForURL((url) => url.hash.startsWith(`#/schedule?season=${historicalSeason}`));

      await desktopFilterButton.click();
      await page.getByRole('button', { name: /^聯賽級別/ }).click();
      const restoredL2Option = page.getByRole('radio', { name: /^(L2|LEAGUE 2)$/ });
      if ((await restoredL2Option.getAttribute('aria-checked')) !== 'true') {
        fail('schedule: returning to schedule did not restore the L2 filter');
      }
      await page.keyboard.press('Escape');

      const matchButton = page.locator('button[data-analytics-event="match_open"]:visible').first();
      await matchButton.waitFor({ state: 'visible' });
      await matchButton.click();
      await page.waitForURL(/match=/);
      await page.getByRole('button', { name: '關閉', exact: true }).click();
      await page.waitForURL((url) => !url.hash.includes('match='));

      await page.goBack();
      await page.waitForURL((url) => url.hash.startsWith(`#/schedule?season=${historicalSeason}`));
      if (page.url().includes('match=')) {
        fail('schedule: browser Back reopened a match after the dialog was closed');
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    try {
      await page.goto(`${baseUrl}/#/news`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#root > *');
      const articleLinks = page.locator('a[data-scroll-anchor-id^="news-"]:visible');
      await articleLinks.first().waitFor({ state: 'visible', timeout: 12000 });
      const articleCount = await articleLinks.count();
      const articleLink = articleLinks.nth(Math.min(2, articleCount - 1));
      await positionAnchor(page, articleLink, 180);
      const anchorId = await articleLink.getAttribute('data-scroll-anchor-id');
      if (!anchorId) fail('news: article link has no scroll anchor id');
      const beforeTop = await articleLink.evaluate((element) => element.getBoundingClientRect().top);

      await articleLink.click();
      await page.waitForURL(/#\/news\//);
      const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
      await backButton.waitFor({ state: 'visible' });
      await backButton.click();
      await page.waitForURL((url) => url.hash === '#/news');
      await waitForAnchorRestore(page, anchorId, beforeTop, 'news article return');
    } finally {
      await page.close();
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log('Return-state validation passed');
