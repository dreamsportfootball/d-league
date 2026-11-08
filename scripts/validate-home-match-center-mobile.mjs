import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/[/]$/, '');
const outputDir = process.env.AUDIT_OUTPUT_DIR ?? 'mobile-match-center-audit';
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const issues = [];
const browser = await chromium.launch({ headless: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

await mkdir(outputDir, { recursive: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-11-08T13:00:00+08:00'));
      await page.goto(baseUrl + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const matchCenter = page.locator('#match-center');
      await matchCenter.waitFor({ state: 'visible', timeout: 30000 });
      await matchCenter.scrollIntoViewIfNeeded();
      const cards = matchCenter.locator('[data-analytics-event="match_open"]');
      await cards.first().waitFor({ state: 'visible', timeout: 20000 });
      assert(await cards.count() === 3, viewport.name + ': expected 3 completed L3 matches on November 8');

      const firstCardGeometry = await cards.first().evaluate(async (card) => {
        const rows = [...card.querySelectorAll('.grid')].filter((node) => node.querySelector('img') && node.querySelector('span'));
        return await Promise.all(rows.map(async (row) => {
          const image = row.querySelector('img');
          const name = row.querySelector('.min-w-0 > span');
          const score = row.lastElementChild;
          await image.decode().catch(() => undefined);
          const imageRect = image.getBoundingClientRect();
          const nameRect = name?.getBoundingClientRect();
          const scoreRect = score?.getBoundingClientRect();
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 64, 64);
          if (image.naturalWidth && image.naturalHeight) {
            const scale = Math.min(64 / image.naturalWidth, 64 / image.naturalHeight);
            const width = image.naturalWidth * scale;
            const height = image.naturalHeight * scale;
            ctx.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
          }
          const pixels = ctx.getImageData(0, 0, 64, 64).data;
          let nonWhitePixels = 0;
          for (let k = 0; k < pixels.length; k += 4) {
            if (255 - Math.min(pixels[k], pixels[k + 1], pixels[k + 2]) >= 35) nonWhitePixels += 1;
          }
          return {
            alt: image.alt,
            src: image.currentSrc,
            loaded: image.complete && image.naturalWidth > 0,
            naturalWidth: image.naturalWidth,
            nonWhiteRatio: Number((nonWhitePixels / 4096).toFixed(4)),
            gap: nameRect && scoreRect ? Number((scoreRect.left - nameRect.right).toFixed(2)) : null,
            nameFontPx: name ? Number.parseFloat(getComputedStyle(name).fontSize) : 0,
            nameHeightPx: nameRect?.height ?? 0,
            nameScrollWidth: name?.scrollWidth ?? 0,
            nameClientWidth: name?.clientWidth ?? 0,
            imageInsideCard: imageRect.left >= card.getBoundingClientRect().left,
          };
        }));
      });
      console.log('[mobile-match-center] ' + viewport.name + ' first-card logos ' + JSON.stringify(firstCardGeometry));
      const firstCardLayout = await cards.first().evaluate((card) => {
        const header = card.firstElementChild;
        const body = card.children[1];
        const stripes = card.lastElementChild;
        const rows = [...body.querySelectorAll('.grid')].filter((row) => row.querySelector('img'));
        const cardRect = card.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const scoreEdges = rows.map((row) => row.lastElementChild?.getBoundingClientRect().right);
        return {
          headerWidthDelta: Math.abs(headerRect.width - cardRect.width),
          bodyWidthDelta: Math.abs(bodyRect.width - cardRect.width),
          headerBackground: getComputedStyle(header).backgroundColor,
          scoreRightDelta: Math.abs(scoreEdges[0] - scoreEdges[1]),
          stripeColors: [...stripes.children].map((stripe) => getComputedStyle(stripe).backgroundColor),
        };
      });
      assert(firstCardLayout.headerWidthDelta <= 2.5 && firstCardLayout.bodyWidthDelta <= 2.5,
        viewport.name + ': match header/body do not occupy full card width: ' + JSON.stringify(firstCardLayout));
      assert(['rgb(250, 250, 250)', 'oklch(0.985 0 0)'].includes(firstCardLayout.headerBackground),
        viewport.name + ': match header is not full-width neutral gray: ' + firstCardLayout.headerBackground);
      assert(firstCardLayout.scoreRightDelta <= 1,
        viewport.name + ': home/away score columns have different right edges: ' + firstCardLayout.scoreRightDelta);
      assert(JSON.stringify(firstCardLayout.stripeColors) === JSON.stringify(['rgb(225, 135, 161)', 'rgb(236, 223, 190)']),
        viewport.name + ': m2627-007 kit colors should be SF pink and Niaoshi beige: ' + firstCardLayout.stripeColors.join(' | '));
      const lastCardStripeColors = await cards.last().evaluate((card) =>
        [...card.lastElementChild.children].map((stripe) => getComputedStyle(stripe).backgroundColor));
      assert(JSON.stringify(lastCardStripeColors) === JSON.stringify(['rgb(25, 30, 84)', 'rgb(239, 180, 198)']),
        viewport.name + ': m2627-009 must use Wanderers navy home and Holy Knights pink away: ' + lastCardStripeColors.join(' | '));

      assert(firstCardGeometry.length === 2, viewport.name + ': expected both team logo images');
      for (const row of firstCardGeometry) {
        assert(row.loaded, viewport.name + ': logo did not load: ' + row.alt);
        assert(row.nonWhiteRatio >= 0.01,
          viewport.name + ': ' + row.alt + ' logo is visually blank at 64px (' + row.nonWhiteRatio + ')');
        assert(row.gap !== null && row.gap >= 8,
          viewport.name + ': ' + row.alt + ' team name lacks score separation (' + row.gap + 'px)');
        assert(row.nameFontPx >= 18,
          viewport.name + ': ' + row.alt + ' team name shrank below restored 18px size (' + row.nameFontPx + 'px)');
        assert(row.nameScrollWidth <= row.nameClientWidth + 1,
          viewport.name + ': ' + row.alt + ' team name overflows its fixed-width column');
      }

      const results = matchCenter.getByRole('tab', { name: '最新賽果' });
      const upcoming = matchCenter.getByRole('tab', { name: '即將開賽' });
      assert(await results.getAttribute('aria-selected') === 'true',
        viewport.name + ': result tab should be active on November 8');
      const tabBounds = await Promise.all([results, upcoming].map((tab) =>
        tab.boundingBox()));
      assert(tabBounds.every((box) => box && box.height >= 44),
        viewport.name + ': mobile tabs must have >= 44px hit areas');

      const carousel = matchCenter.locator('.snap-x');
      const centering = async (locator, label) => {
        const rect = await locator.boundingBox();
        const area = await carousel.boundingBox();
        assert(rect && area, viewport.name + ': ' + label + ' bounds unavailable');
        const offset = Math.abs(rect.x + rect.width / 2 - (area.x + area.width / 2));
        assert(offset <= 2, viewport.name + ': ' + label + ' is ' + offset.toFixed(2) + 'px off-center');
        assert(rect.x >= area.x - 1 && rect.x + rect.width <= area.x + area.width + 1,
          viewport.name + ': ' + label + ' clipped');
      };

      await carousel.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.first(), 'first result card');
      await carousel.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.last(), 'last result card');
      await page.screenshot({
        path: path.join(outputDir, viewport.name + '__results.png'),
        animations: 'disabled',
      });

      await upcoming.click();
      assert(await upcoming.getAttribute('aria-selected') === 'true',
        viewport.name + ': upcoming tab did not activate');
      await cards.first().waitFor({ state: 'visible' });
      assert(await cards.count() === 6, viewport.name + ': expected 6 fixtures on November 15');
      await carousel.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await centering(cards.first(), 'first upcoming card');

      await results.click();
      assert(await results.getAttribute('aria-selected') === 'true',
        viewport.name + ': result tab did not reactivate');
      assert(await cards.count() === 3, viewport.name + ': November 8 results not restored');
      const beforeScroll = await page.evaluate(() => window.scrollY);
      await cards.first().click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="match-dialog-title"]');
      await dialog.waitFor({ state: 'visible' });
      const bounds = await dialog.boundingBox();
      assert(bounds && bounds.x >= -1 && bounds.x + bounds.width <= viewport.width + 1,
        viewport.name + ': match dialog overflows horizontally');
      assert(bounds.y >= -1 && bounds.y + bounds.height <= viewport.height + 1,
        viewport.name + ': match dialog exceeds viewport height');
      assert(await page.evaluate(() => document.body.style.overflow) === 'hidden',
        viewport.name + ': dialog did not lock background scrolling');
      await page.screenshot({
        path: path.join(outputDir, viewport.name + '__dialog.png'),
        animations: 'disabled',
      });
      await dialog.getByRole('button', { name: '關閉', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert(await page.evaluate(() => document.body.style.overflow) !== 'hidden',
        viewport.name + ': background scroll remains locked after closing dialog');
      const afterScroll = await page.evaluate(() => window.scrollY);
      assert(Math.abs(afterScroll - beforeScroll) <= 2,
        viewport.name + ': closing dialog moved page by ' + (afterScroll - beforeScroll) + 'px');
      assert(errors.length === 0, viewport.name + ': runtime errors: ' + errors.join(' | '));
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert(pageWidth <= viewport.width + 1, viewport.name + ': page horizontal overflow ' + pageWidth);
      console.log('[mobile-match-center] ' + viewport.name + ' passed');
    } catch (error) {
      issues.push(viewport.name + ': ' + error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (issues.length) {
  issues.forEach((issue) => console.error('[mobile-match-center] ' + issue));
  process.exitCode = 1;
} else {
  console.log('[mobile-match-center] mobile carousels, tabs, dialogs and scroll position passed');
}
