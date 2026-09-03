import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 },
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

    const storageAfterClick = await page.evaluate(() =>
      Object.fromEntries(
        Object.keys(sessionStorage)
          .filter((key) => key.startsWith('dleague:scroll'))
          .sort()
          .map((key) => [key, sessionStorage.getItem(key)]),
      ),
    );
    console.log(`${viewport.name}: storage after click`, JSON.stringify(storageAfterClick));

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
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          storage: Object.fromEntries(
            Object.keys(sessionStorage)
              .filter((key) => key.startsWith('dleague:scroll'))
              .sort()
              .map((key) => [key, sessionStorage.getItem(key)]),
          ),
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
        storage: Object.fromEntries(
          Object.keys(sessionStorage)
            .filter((key) => key.startsWith('dleague:scroll'))
            .sort()
            .map((key) => [key, sessionStorage.getItem(key)]),
        ),
      };
    }, { label: ariaLabel, scrollAnchorId: anchorId });

    console.log(
      `${viewport.name}: before top=${beforeTop.toFixed(1)} scrollY=${beforeScrollY}; final=${JSON.stringify(finalState)}`,
    );

    if (!restored || finalState.top === null) {
      fail(`${viewport.name}: did not restore clicked team within ${allowedDelta}px; diagnostics=${JSON.stringify(finalState)}`);
    }

    const delta = Math.abs(finalState.top - beforeTop);
    console.log(`${viewport.name}: restored clicked team within ${delta.toFixed(1)}px`);

    await page.goto(`${baseUrl}/#/standings?season=2026-27`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *');

    const currentTeamLink = page.locator('a[href*="/teams/"][href*="season=2026-27"]:visible').first();
    await currentTeamLink.waitFor({ state: 'visible' });
    await currentTeamLink.click();
    await page.waitForURL(/#\/teams\/.*season=2026-27/);

    const currentPlayerLink = page.locator('a[href*="/players/"][href*="season=2026-27"]').first();
    await currentPlayerLink.waitFor({ state: 'visible' });
    await currentPlayerLink.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 200), behavior: 'auto' });
    });
    await page.waitForTimeout(150);

    const currentPlayerHref = await currentPlayerLink.getAttribute('href');
    if (!currentPlayerHref) fail(`${viewport.name}: current player link has no href`);
    const currentPlayerTop = await currentPlayerLink.evaluate((element) => element.getBoundingClientRect().top);

    await currentPlayerLink.click();
    await page.waitForURL(/#\/players\/.*season=2026-27/);
    const currentBackButton = page.getByRole('button', { name: '返回上一頁' }).first();
    await currentBackButton.waitFor({ state: 'visible' });
    await currentBackButton.click();
    await page.waitForURL(/#\/teams\/.*season=2026-27/);

    const currentStartedAt = Date.now();
    let currentRestored = false;
    let currentFinalTop = null;
    while (Date.now() - currentStartedAt < restoreTimeoutMs) {
      currentFinalTop = await page.evaluate((href) => {
        const link = [...document.querySelectorAll('a[href]')]
          .find((element) => element.getAttribute('href') === href);
        return link instanceof HTMLElement ? link.getBoundingClientRect().top : null;
      }, currentPlayerHref);
      if (currentFinalTop !== null && Math.abs(currentFinalTop - currentPlayerTop) <= allowedDelta) {
        currentRestored = true;
        break;
      }
      await page.waitForTimeout(100);
    }

    if (!currentRestored || currentFinalTop === null) {
      fail(`${viewport.name}: 2026/27 team -> player -> back did not restore player position; before=${currentPlayerTop}, after=${currentFinalTop}`);
    }
    console.log(`${viewport.name}: 2026/27 player return restored within ${Math.abs(currentFinalTop - currentPlayerTop).toFixed(1)}px`);

    await page.goto(`${baseUrl}/#/standings?season=2025-26`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *');

    const historicalTeamLink = page.locator('a[href*="/teams/"][href*="season=2025-26"]:visible').first();
    await historicalTeamLink.waitFor({ state: 'visible' });
    await historicalTeamLink.click();
    await page.waitForURL(/#\/teams\/.*season=2025-26/);

    const historicalPlayerLink = page.locator('a[href*="/players/"][href*="season=2025-26"]').first();
    await historicalPlayerLink.waitFor({ state: 'visible' });
    await historicalPlayerLink.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 200), behavior: 'auto' });
    });
    await page.waitForTimeout(150);

    const historicalPlayerHref = await historicalPlayerLink.getAttribute('href');
    if (!historicalPlayerHref) fail(`${viewport.name}: historical player link has no href`);
    const historicalPlayerTop = await historicalPlayerLink.evaluate((element) => element.getBoundingClientRect().top);

    await historicalPlayerLink.click();
    await page.waitForURL(/#\/players\/.*season=2025-26/);
    const backButton = page.getByRole('button', { name: '返回上一頁' }).first();
    await backButton.waitFor({ state: 'visible' });
    await backButton.click();
    await page.waitForURL(/#\/teams\/.*season=2025-26/);

    const historicalStartedAt = Date.now();
    let historicalRestored = false;
    let historicalFinalTop = null;
    while (Date.now() - historicalStartedAt < restoreTimeoutMs) {
      historicalFinalTop = await page.evaluate((href) => {
        const link = [...document.querySelectorAll('a[href]')]
          .find((element) => element.getAttribute('href') === href);
        return link instanceof HTMLElement ? link.getBoundingClientRect().top : null;
      }, historicalPlayerHref);
      if (historicalFinalTop !== null && Math.abs(historicalFinalTop - historicalPlayerTop) <= allowedDelta) {
        historicalRestored = true;
        break;
      }
      await page.waitForTimeout(100);
    }

    if (!historicalRestored || historicalFinalTop === null) {
      fail(`${viewport.name}: historical team -> player -> back did not restore player position; before=${historicalPlayerTop}, after=${historicalFinalTop}`);
    }
    console.log(`${viewport.name}: historical player return restored within ${Math.abs(historicalFinalTop - historicalPlayerTop).toFixed(1)}px`);
  } finally {
    await page.close();
    await context.close();
  }
}

await browser.close();
console.log('Scroll restoration validation passed');
