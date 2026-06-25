import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';
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
  { name: 'news', path: '/news' },
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
  { name: 'schedule-desktop-filter', path: '/schedule?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'standings-desktop-filter', path: '/standings?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'stats-desktop-filter', path: '/stats?season=2026-27', viewport: 'desktop-1280', action: 'filter' },
  { name: 'media-desktop-filter', path: '/media', viewport: 'desktop-1280', action: 'filter' },
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
  await page.waitForTimeout(500);
};

const collectDiagnostics = async (page) =>
  page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    const bodyText = document.body.innerText;
    const fixedElements = [...document.querySelectorAll('*')]
      .filter((element) => getComputedStyle(element).position === 'fixed')
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          ariaLabel: element.getAttribute('aria-label'),
          text: element.textContent?.trim().slice(0, 80) ?? '',
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });

    return {
      title: document.title,
      documentWidth,
      viewportWidth,
      horizontalOverflow: documentWidth > viewportWidth + 1,
      bodyText: bodyText.slice(0, 7000),
      hasSeasonControl: [...document.querySelectorAll('button, select')].some((element) => {
        const label = `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''}`;
        return /選擇賽季|更改賽季|賽季篩選/.test(label);
      }),
      fixedElements,
    };
  });

const auditViewport = async (viewport) => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'zh-TW',
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

      const addAssertion = (name, passed, detail) => {
        assertions.push({ name, passed, detail });
        if (!passed) report.failures.push({ viewport: viewport.name, route: route.name, name, detail });
      };

      addAssertion('no-horizontal-overflow', !diagnostics.horizontalOverflow, `${diagnostics.documentWidth}/${diagnostics.viewportWidth}`);
      addAssertion('no-page-error', pageErrors.length === 0, pageErrors.join(' | '));

      if (route.name === 'standings-2026') {
        addAssertion('standings-summary-has-season-league', diagnostics.bodyText.includes('2026/27 · L1'), 'Expected 2026/27 · L1');
        addAssertion('standings-summary-hides-team-count', !diagnostics.bodyText.includes('支球隊'), 'Team count must not appear in standings toolbar');
      }

      if (route.name === 'stats-2026') {
        addAssertion('stats-summary-has-season-league', diagnostics.bodyText.includes('2026/27 · L1'), 'Expected 2026/27 · L1');
        addAssertion('stats-inline-league-row-removed', !diagnostics.bodyText.includes('選擇聯賽'), 'League selection must be inside filter drawer');
      }

      if (route.name === 'news') {
        addAssertion('news-has-no-season-control', !diagnostics.hasSeasonControl, 'News must not expose a season selector');
        addAssertion('news-has-global-tabs', diagnostics.bodyText.includes('全部消息') && diagnostics.bodyText.includes('賽事戰報') && diagnostics.bodyText.includes('官方公告'), 'Expected global news tabs');
      }

      if (route.name === 'media-default') {
        addAssertion('media-defaults-current-season', diagnostics.bodyText.includes('D LEAGUE 2026/27'), 'Media must default to 2026/27');
      }

      const screenshotPath = path.join(outputDir, 'screenshots', `${viewport.name}__${route.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: viewport.name === 'mobile-390' || viewport.name === 'desktop-1280',
        animations: 'disabled',
      });

      report.pages.push({
        viewport: viewport.name,
        route: route.name,
        url: page.url(),
        screenshot: screenshotPath,
        diagnostics: {
          title: diagnostics.title,
          documentWidth: diagnostics.documentWidth,
          viewportWidth: diagnostics.viewportWidth,
          horizontalOverflow: diagnostics.horizontalOverflow,
          fixedElements: diagnostics.fixedElements,
        },
        assertions,
        consoleErrors,
        pageErrors,
      });
    } catch (error) {
      report.failures.push({ viewport: viewport.name, route: route.name, name: 'audit-execution', detail: error.message });
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
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  try {
    await page.goto(makeUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: 20000 });
    await waitForStablePage(page);

    if (testCase.action === 'mobile-menu') {
      const trigger = page.getByRole('button', { name: /開啟.*選單|選單/i }).last();
      await trigger.click();
    } else {
      const trigger = page.getByRole('button', { name: /篩選|更改賽季|開啟.*篩選/i }).first();
      await trigger.click();
    }

    await page.waitForTimeout(250);
    const screenshotPath = path.join(outputDir, 'screenshots', `${testCase.viewport}__${testCase.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });

    const stateInfo = await page.evaluate((action) => {
      const dialog = document.querySelector('[role="dialog"]');
      const bodyText = document.body.innerText;
      const target = dialog ?? document.body;
      const rect = target.getBoundingClientRect();
      const menuVisible = action === 'mobile-menu' && bodyText.includes('賽季報名') && bodyText.includes('賽程與結果') && getComputedStyle(document.body).overflow === 'hidden';
      return {
        text: target.textContent?.trim().slice(0, 1500) ?? '',
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        dialogVisible: Boolean(dialog),
        menuVisible,
      };
    }, testCase.action);

    const passed = testCase.action === 'mobile-menu' ? stateInfo.menuVisible : stateInfo.dialogVisible;
    if (!passed) report.failures.push({ viewport: testCase.viewport, route: testCase.name, name: 'interactive-state-opened', detail: JSON.stringify(stateInfo) });

    report.interactive.push({
      name: testCase.name,
      viewport: testCase.viewport,
      screenshot: screenshotPath,
      stateInfo,
      passed,
    });
  } catch (error) {
    report.failures.push({ viewport: testCase.viewport, route: testCase.name, name: 'interactive-audit', detail: error.message });
    report.interactive.push({ name: testCase.name, viewport: testCase.viewport, error: error.message, passed: false });
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

console.log(`Visual audit complete: ${report.pages.length} pages, ${report.interactive.length} interactive states, ${report.failures.length} failure(s).`);
