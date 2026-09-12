import { chromium } from 'playwright';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const tolerancePx = 2;

const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

const cases = [
  {
    name: 'schedule-current',
    path: '/schedule?season=2026-27',
    target: 'deep',
    expectsMatchQuery: true,
  },
  {
    name: 'schedule-historical',
    path: '/schedule?season=2025-26',
    target: 'deep',
    expectsMatchQuery: true,
  },
  {
    name: 'home-match-center',
    path: '/',
    target: 'last',
  },
  {
    name: 'team-page',
    path: '/teams/t_chiayi?season=2025-26',
    target: 'last',
  },
  {
    name: 'player-page',
    path: '/players/lz-10?season=2025-26',
    target: 'last',
    setup: 'player-season',
  },
  {
    name: 'round-page',
    path: '/rounds/2025-26/L1/1',
    target: 'last',
  },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

const makeUrl = (routePath) => `${baseUrl}/#${routePath}`;
const delta = (a, b) => Math.abs(a - b);

const waitForStablePage = async (page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#root > *', { timeout: 12000 });
  await page.waitForTimeout(900);
};

const closeRecruitmentPopupIfVisible = async (page) => {
  const closeButton = page.getByRole('button', { name: '關閉工作人員合作隊招募' }).last();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(150);
  }
};

const prepareCase = async (page, testCase) => {
  await closeRecruitmentPopupIfVisible(page);

  if (testCase.setup === 'player-season') {
    const seasonSelect = page.getByRole('combobox', { name: '篩選比賽事件賽季' });
    if (await seasonSelect.isVisible().catch(() => false)) {
      await seasonSelect.selectOption('2025-26');
      await page.waitForTimeout(250);
    }
  }
};

const getVisibleMatchButtons = async (page) =>
  page.locator('[data-analytics-event="match_open"]:visible').all();

const chooseTargetButton = async (page, testCase) => {
  const buttons = await getVisibleMatchButtons(page);
  if (buttons.length === 0) throw new Error('no visible match button');

  if (testCase.target === 'deep') {
    return buttons[Math.min(20, buttons.length - 1)];
  }
  if (testCase.target === 'last') return buttons[buttons.length - 1];
  return buttons[Math.floor(buttons.length / 2)];
};

const positionTarget = async (page, button) => {
  await button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const desiredTop = Math.max(120, Math.round(window.innerHeight * 0.38));
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetScrollY = Math.max(0, Math.min(maxScrollY, absoluteTop - desiredTop));
    window.scrollTo({ top: targetScrollY, behavior: 'auto' });
  });
  await page.waitForTimeout(120);
};

const readPosition = async (page, button) => ({
  scrollY: await page.evaluate(() => window.scrollY),
  top: await button.evaluate((element) => element.getBoundingClientRect().top),
});

const assertDelta = (viewportName, caseName, phase, actual, expected) => {
  const difference = delta(actual, expected);
  if (difference > tolerancePx) {
    failures.push(`${viewportName} / ${caseName} / ${phase}: ${difference.toFixed(2)}px (expected ${expected.toFixed(2)}, got ${actual.toFixed(2)})`);
  }
  return difference;
};

for (const viewport of viewports) {
  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    try {
      await page.goto(makeUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: 20000 });
      await waitForStablePage(page);
      await prepareCase(page, testCase);

      const targetButton = await chooseTargetButton(page, testCase);
      await positionTarget(page, targetButton);
      const matchId = await targetButton.getAttribute('data-analytics-label');
      if (!matchId) throw new Error('target match button has no analytics label');

      const before = await readPosition(page, targetButton);
      await targetButton.click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible' });
      await page.waitForTimeout(320);

      const openScrollY = await page.evaluate(() => window.scrollY);
      const openDelta = assertDelta(viewport.name, testCase.name, 'open-scroll', openScrollY, before.scrollY);

      if (testCase.expectsMatchQuery && !new URL(page.url()).hash.includes('match=')) {
        failures.push(`${viewport.name} / ${testCase.name} / open-url: expected match query in ${page.url()}`);
      }

      let switchDelta = 0;
      const nextButton = dialog.getByRole('button', { name: '下一場' });
      const previousButton = dialog.getByRole('button', { name: '上一場' });
      const canUseNext = await nextButton.isEnabled().catch(() => false);
      const canUsePrevious = await previousButton.isEnabled().catch(() => false);
      if (canUseNext || canUsePrevious) {
        const navigationButton = canUseNext ? nextButton : previousButton;
        await navigationButton.click();
        await page.waitForTimeout(220);
        const switchedScrollY = await page.evaluate(() => window.scrollY);
        switchDelta = assertDelta(viewport.name, testCase.name, 'switch-match-scroll', switchedScrollY, before.scrollY);
      }

      await page.getByRole('button', { name: '關閉比賽詳情' }).click({ position: { x: 4, y: 4 } });
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForTimeout(550);

      const originalButton = page.locator(
        `[data-analytics-event="match_open"][data-analytics-label="${matchId}"]:visible`,
      ).first();
      await originalButton.waitFor({ state: 'visible' });
      const after = await readPosition(page, originalButton);
      const closeDelta = assertDelta(viewport.name, testCase.name, 'close-scroll', after.scrollY, before.scrollY);
      const cardDelta = assertDelta(viewport.name, testCase.name, 'close-card-position', after.top, before.top);

      if (testCase.expectsMatchQuery && new URL(page.url()).hash.includes('match=')) {
        failures.push(`${viewport.name} / ${testCase.name} / close-url: match query remained in ${page.url()}`);
      }
      if (pageErrors.length > 0) {
        failures.push(`${viewport.name} / ${testCase.name} / page-error: ${pageErrors.join(' | ')}`);
      }

      console.log(
        `[match-dialog-scroll] ${viewport.name} / ${testCase.name}: ` +
        `openΔ=${openDelta.toFixed(2)}px, switchΔ=${switchDelta.toFixed(2)}px, ` +
        `closeΔ=${closeDelta.toFixed(2)}px, cardΔ=${cardDelta.toFixed(2)}px`,
      );
    } catch (error) {
      failures.push(`${viewport.name} / ${testCase.name} / execution: ${error.message}`);
    } finally {
      await page.close();
      await context.close();
    }
  }
}

await browser.close();

if (failures.length > 0) {
  console.error(`Match dialog scroll stability failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Match dialog scroll stability passed: ${viewports.length * cases.length} flows, tolerance ${tolerancePx}px`);
}
