import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const outputDir = process.env.AUDIT_OUTPUT_DIR ?? 'visual-audit';

const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

const routes = [
  { name: 'home', path: '/' },
  { name: 'registration', path: '/registration' },
  { name: 'schedule-2026', path: '/schedule?season=2026-27' },
  { name: 'standings-2026', path: '/standings?season=2026-27' },
  { name: 'standings-2025', path: '/standings?season=2025-26' },
  { name: 'stats-2026', path: '/stats?season=2026-27' },
  { name: 'stats-2025', path: '/stats?season=2025-26' },
  { name: 'news', path: '/news' },
  { name: 'article-detail', path: '/news/2026-27-registration-open' },
  { name: 'team-detail', path: '/teams/t_chiayi?season=2025-26' },
  { name: 'player-detail', path: '/players/cy-01?season=2025-26' },
  { name: 'match-compat', path: '/matches/m1?season=2025-26' },
  { name: 'media-default', path: '/media' },
  { name: 'media-2025', path: '/media?season=2025-26' },
  { name: 'cup', path: '/cup' },
  { name: 'about', path: '/about' },
];

const interactiveCases = [
  { name: 'mobile-menu', path: '/', viewport: 'mobile-390', action: 'mobile-menu' },
  { name: 'schedule-mobile-filter', path: '/schedule?season=2026-27', viewport: 'mobile-390', action: 'filter' },
  { name: 'standings-mobile-filter', path: '/standings?season=2026-27', viewport: 'mobile-390', action: 'filter' },
  { name: 'stats-mobile-filter', path: '/stats?season=2026-27', viewport: 'mobile-390', action: 'filter' },
  { name: 'media-mobile-filter', path: '/media', viewport: 'mobile-390', action: 'filter' },
  { name: 'news-mobile-load-more', path: '/news', viewport: 'mobile-390', action: 'load-more' },
  { name: 'team-mobile-match-dialog', path: '/teams/t_chiayi?season=2025-26', viewport: 'mobile-390', action: 'match-dialog' },
  { name: 'player-mobile-match-dialog', path: '/players/lz-10?season=2025-26', viewport: 'mobile-390', action: 'match-dialog' },
  { name: 'schedule-desktop-filter', path: '/schedule?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'standings-desktop-filter', path: '/standings?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'stats-desktop-filter', path: '/stats?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'media-desktop-filter', path: '/media', viewport: 'desktop-1280', action: 'filter' },
  { name: 'news-desktop-load-more', path: '/news', viewport: 'desktop-1280', action: 'load-more' },
  { name: 'team-desktop-match-dialog', path: '/teams/t_chiayi?season=2025-26', viewport: 'desktop-1280', action: 'match-dialog' },
  { name: 'media-desktop-playlist', path: '/media?season=2025-26', viewport: 'desktop-1280', action: 'playlist' },
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(path.join(outputDir, 'screenshots'), { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  pages: [],
  interactive: [],
  failures: [],
};

const makeUrl = (routePath) => `${baseUrl}/#${routePath}`;

const waitForStablePage = async (page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#root > *', { timeout: 12000 });
  await page.waitForTimeout(650);
};

const collectDiagnostics = async (page) =>
  page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    const bodyText = document.body.innerText;
    const fixedElements = [...document.querySelectorAll('*')]
      .filter((element) => getComputedStyle(element).position === 'fixed')
      .map((element) => ({
        tag: element.tagName,
        ariaLabel: element.getAttribute('aria-label'),
        text: element.textContent?.trim().slice(0, 120) ?? '',
      }));

    return {
      title: document.title,
      documentWidth,
      viewportWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow: documentWidth > viewportWidth + 1,
      bodyText: bodyText.slice(0, 12000),
      hasSeasonControl: [...document.querySelectorAll('button, select')].some((element) => {
        const label = `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''}`;
        return /選擇賽季|更改賽季|賽季篩選/.test(label);
      }),
      newsCardCount: document.querySelectorAll('main a[href*="/news/"]').length,
      loadMoreVisible: [...document.querySelectorAll('main button')].some(
        (element) => element.textContent?.includes('載入更多消息') && getComputedStyle(element).display !== 'none',
      ),
      playerLinkCount: document.querySelectorAll('main a[href*="/players/"]').length,
      teamLinkCount: document.querySelectorAll('main a[href*="/teams/"]').length,
      matchOpenButtonCount: document.querySelectorAll('main [data-analytics-event="match_open"]').length,
      fixedElements,
    };
  });

const addFailure = (viewport, route, name, detail) => {
  report.failures.push({ viewport, route, name, detail });
};

const auditViewport = async (viewport) => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'zh-TW',
    timezoneId: 'UTC',
    serviceWorkers: 'block',
  });

  for (const route of routes) {
    console.log(`[page] ${viewport.name} / ${route.name}`);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    try {
      await page.goto(makeUrl(route.path), { waitUntil: 'domcontentloaded', timeout: 20000 });
      await waitForStablePage(page);
      const diagnostics = await collectDiagnostics(page);
      const assertions = [];

      const assert = (name, passed, detail) => {
        assertions.push({ name, passed, detail });
        if (!passed) addFailure(viewport.name, route.name, name, detail);
      };

      assert(
        'no-horizontal-overflow',
        !diagnostics.horizontalOverflow,
        `${diagnostics.documentWidth}/${diagnostics.viewportWidth}`,
      );
      assert('no-page-error', pageErrors.length === 0, pageErrors.join(' | '));

      if (route.name === 'home') {
        assert(
          'home-identifies-league',
          diagnostics.bodyText.includes('D LEAGUE') || diagnostics.title.includes('D LEAGUE'),
          'Expected D LEAGUE identity on home page',
        );
      }

      if (route.name === 'standings-2026') {
        const expectedStatusLabel = viewport.width < 768 ? '2026/27 · L1' : '2026/27 賽季 · L1';
        const visibleLeagueTabs = await page.locator('[role="tab"]:visible').evaluateAll((elements) =>
          elements.filter((element) => /^L[123]$/.test(element.textContent?.trim() ?? '')).length,
        );
        const filterControlVisible = await page.getByRole('button', { name: '篩選積分榜' }).isVisible();
        assert('standings-shows-season-league-summary', diagnostics.bodyText.includes(expectedStatusLabel), `Expected ${expectedStatusLabel}`);
        assert('standings-shows-filter-control', filterControlVisible, 'Expected visible standings filter control');
        assert('standings-hides-inline-league-tabs', visibleLeagueTabs === 0, `Found ${visibleLeagueTabs} visible tab(s)`);
        assert('standings-summary-hides-team-count', !diagnostics.bodyText.includes('支球隊'), 'Team count must not appear');
      }

      if (route.name === 'stats-2026') {
        assert('stats-summary-has-season-league', diagnostics.bodyText.includes('2026/27 · L1'), 'Expected 2026/27 · L1');
        assert('stats-inline-league-row-removed', !diagnostics.bodyText.includes('選擇聯賽'), 'League selector must stay inside drawer');
      }

      if (route.name === 'stats-2025') {
        assert('historical-stats-resolve', diagnostics.bodyText.includes('2025/26') && !diagnostics.bodyText.includes('找不到'), 'Expected historical stats page');
        assert('historical-stats-links-player-entities', diagnostics.playerLinkCount > 0, `Found ${diagnostics.playerLinkCount} player link(s)`);
      }

      if (route.name === 'news') {
        assert('news-has-no-season-control', !diagnostics.hasSeasonControl, 'News must not expose season selector');
        assert('news-has-global-tabs', diagnostics.bodyText.includes('全部消息') && diagnostics.bodyText.includes('賽事戰報') && diagnostics.bodyText.includes('官方公告'), 'Expected global news tabs');
        assert('news-initial-batch-limited', diagnostics.newsCardCount <= 9, `Rendered ${diagnostics.newsCardCount} cards`);
        assert('news-load-more-visible', diagnostics.loadMoreVisible, 'Expected load more control');
      }

      if (route.name === 'article-detail') {
        assert('article-detail-resolves', diagnostics.bodyText.includes('D LEAGUE 2026/27 正式開放報名') && !diagnostics.bodyText.includes('文章不存在'), 'Expected registration article');
        assert('article-date-uses-taipei-timezone', diagnostics.bodyText.includes('2026.06.23'), 'Expected 2026.06.23 under UTC browser timezone');
      }

      if (route.name === 'team-detail') {
        assert('historical-team-keeps-permanent-page', page.url().includes('#/teams/t_chiayi?season=2025-26') && diagnostics.bodyText.includes('2025/26') && diagnostics.bodyText.includes('嘉義諸羅山FC'), `Resolved ${page.url()}`);
        assert('team-page-has-official-sections', diagnostics.bodyText.includes('賽程與賽果') && diagnostics.bodyText.includes('球員名單') && diagnostics.bodyText.includes('歷年 D LEAGUE'), 'Expected schedule, squad and history sections');
        assert('team-page-links-player-entities', diagnostics.playerLinkCount > 0, `Found ${diagnostics.playerLinkCount} player link(s)`);
        assert('team-page-has-match-dialog-buttons', diagnostics.matchOpenButtonCount > 0, `Found ${diagnostics.matchOpenButtonCount} match button(s)`);
      }

      if (route.name === 'player-detail') {
        assert('player-page-resolves', page.url().includes('#/players/cy-01?season=2025-26') && diagnostics.bodyText.includes('陳日揚') && diagnostics.bodyText.includes('賽季紀錄'), `Resolved ${page.url()}`);
        assert('player-page-links-team-entity', diagnostics.teamLinkCount > 0, `Found ${diagnostics.teamLinkCount} team link(s)`);
      }

      if (route.name === 'match-compat') {
        const dialogVisible = (await page.locator('[role="dialog"]').count()) > 0;
        assert('legacy-match-url-redirects-to-schedule-dialog', page.url().includes('#/schedule?season=2025-26&match=m1') && dialogVisible, `Resolved ${page.url()}, dialog=${dialogVisible}`);
      }

      if (route.name === 'media-default') {
        assert('media-defaults-current-season', diagnostics.bodyText.includes('D LEAGUE 2026/27'), 'Media must default to 2026/27');
      }

      const screenshotPath = path.join(outputDir, 'screenshots', `${viewport.name}__${route.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: viewport.name === 'mobile-390' || viewport.name === 'desktop-1280',
        animations: 'disabled',
      });

      report.pages.push({ viewport: viewport.name, route: route.name, url: page.url(), screenshot: screenshotPath, diagnostics, assertions, consoleErrors, pageErrors });
    } catch (error) {
      addFailure(viewport.name, route.name, 'audit-execution', error.message);
      report.pages.push({ viewport: viewport.name, route: route.name, error: error.message, consoleErrors, pageErrors });
    } finally {
      await page.close();
    }
  }

  await context.close();
};

await Promise.all(viewports.map(auditViewport));

const auditInteractiveCase = async (testCase) => {
  const viewport = viewports.find((item) => item.name === testCase.viewport);
  if (!viewport) return;

  console.log(`[interactive] ${testCase.viewport} / ${testCase.name}`);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'zh-TW',
    timezoneId: 'UTC',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  try {
    await page.goto(makeUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: 20000 });
    await waitForStablePage(page);

    let beforeCount = null;
    let afterCount = null;

    if (testCase.action === 'mobile-menu') {
      const popupCloseButton = page.getByRole('button', { name: '關閉工作人員合作隊招募' }).last();
      if (await popupCloseButton.isVisible()) {
        await popupCloseButton.click();
        await page.waitForTimeout(150);
      }
      await page.getByRole('button', { name: /開啟.*選單|選單/i }).last().click();
    } else if (testCase.action === 'load-more') {
      beforeCount = await page.locator('main a[href*="/news/"]').count();
      await page.getByRole('button', { name: '載入更多消息' }).click();
      await page.waitForTimeout(300);
      afterCount = await page.locator('main a[href*="/news/"]').count();
    } else if (testCase.action === 'match-dialog') {
      await page.locator('[data-analytics-event="match_open"]:visible').first().click();
      await page.waitForTimeout(250);
    } else if (testCase.action === 'playlist') {
      await page.getByRole('button', { name: /播放.*賽季完整賽事/ }).click();
      await page.waitForTimeout(350);
    } else {
      await page.getByRole('button', { name: /篩選|更改賽季|開啟.*篩選|選擇.*賽季|過往賽季/i }).first().click();
    }

    await page.waitForTimeout(250);
    const dialogVisible = (await page.locator('[role="dialog"]').count()) > 0;
    const playlistVisible = (await page.locator('iframe[title*="比賽影片"]').count()) > 0;
    const menuVisible = testCase.action === 'mobile-menu'
      ? await page.evaluate(() => document.body.innerText.includes('賽季報名') && getComputedStyle(document.body).overflow === 'hidden')
      : false;
    const passed = testCase.action === 'mobile-menu'
      ? menuVisible
      : testCase.action === 'load-more'
        ? beforeCount !== null && afterCount !== null && afterCount > beforeCount
        : testCase.action === 'match-dialog'
          ? dialogVisible
          : testCase.action === 'playlist'
            ? playlistVisible
            : dialogVisible;

    if (!passed) {
      addFailure(testCase.viewport, testCase.name, 'interactive-state', JSON.stringify({ dialogVisible, playlistVisible, menuVisible, beforeCount, afterCount }));
    }

    const screenshotPath = path.join(outputDir, 'screenshots', `${testCase.viewport}__${testCase.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });
    report.interactive.push({ ...testCase, screenshot: screenshotPath, dialogVisible, playlistVisible, menuVisible, beforeCount, afterCount, passed });
  } catch (error) {
    addFailure(testCase.viewport, testCase.name, 'interactive-audit', error.message);
    report.interactive.push({ ...testCase, error: error.message, passed: false });
  } finally {
    await page.close();
    await context.close();
  }
};

await Promise.all(interactiveCases.map(auditInteractiveCase));
await browser.close();

await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
await fs.writeFile(
  path.join(outputDir, 'summary.txt'),
  [
    `Visual audit generated at ${report.generatedAt}`,
    `Pages checked: ${report.pages.length}`,
    `Interactive states checked: ${report.interactive.length}`,
    `Failures: ${report.failures.length}`,
    ...report.failures.map((failure) => `- ${failure.viewport} / ${failure.route} / ${failure.name}: ${failure.detail}`),
  ].join('\n'),
);

console.log(`Visual audit complete: ${report.pages.length} pages, ${report.interactive.length} states, ${report.failures.length} failure(s).`);
if (report.failures.length > 0) process.exitCode = 1;
