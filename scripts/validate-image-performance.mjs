import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league';
const report = JSON.parse(await readFile('image-optimization-report.json', 'utf8'));

const fail = (message) => {
  throw new Error(`Image performance validation failed: ${message}`);
};

if (!report.optimized) fail(`optimizer did not run: ${report.reason ?? 'unknown reason'}`);
if (!Number.isFinite(report.fileCount) || report.fileCount < 1) fail('no raster images were optimized');
if (!Number.isFinite(report.savedPercent) || report.savedPercent <= 0) fail('optimized images did not reduce transfer size');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});

const inspectRoute = async (route) => {
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *', { timeout: 12000 });
    await page.waitForTimeout(700);

    const result = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      images: [...document.images].map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          alt: image.alt,
          src: image.getAttribute('src') ?? '',
          currentSrc: image.currentSrc,
          loading: image.loading,
          decoding: image.decoding,
          fetchPriority: image.getAttribute('fetchpriority') ?? '',
          top: rect.top,
          bottom: rect.bottom,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
        };
      }),
    }));

    if (pageErrors.length > 0) fail(`${route}: ${pageErrors.join(' | ')}`);

    const visibleBroken = result.images.filter(
      (image) => image.bottom > 0 && image.top < result.viewportHeight && image.complete && image.naturalWidth === 0,
    );
    if (visibleBroken.length > 0) {
      fail(`${route}: visible broken image ${visibleBroken.map((image) => image.alt || image.src).join(', ')}`);
    }

    const deferredWithoutLazy = result.images.filter(
      (image) => image.top >= result.viewportHeight * 1.25 && image.loading !== 'lazy',
    );
    if (deferredWithoutLazy.length > 0) {
      fail(`${route}: below-fold images are not lazy loaded`);
    }

    const withoutAsyncDecoding = result.images.filter((image) => image.decoding !== 'async');
    if (withoutAsyncDecoding.length > 0) {
      fail(`${route}: images missing async decoding`);
    }

    return result;
  } finally {
    await page.close();
  }
};

try {
  const home = await inspectRoute('/');
  const hero = home.images.find((image) => image.alt.includes('正式報名開放') || image.alt.includes('主視覺'));
  if (!hero) fail('homepage hero image was not found');
  if (!/\.webp(?:$|\?)/.test(hero.currentSrc)) fail(`homepage hero is not WebP: ${hero.currentSrc}`);
  if (hero.loading !== 'eager' || hero.fetchPriority !== 'high') {
    fail('homepage hero is not prioritized');
  }

  const news = await inspectRoute('/news');
  const localNewsImage = news.images.find((image) => image.currentSrc.includes('/assets/'));
  if (localNewsImage && !/\.webp(?:$|\?)/.test(localNewsImage.currentSrc)) {
    fail(`news image is not WebP: ${localNewsImage.currentSrc}`);
  }

  const media = await inspectRoute('/media?season=2025-26');
  const localMediaImage = media.images.find((image) => image.currentSrc.includes('/assets/'));
  if (localMediaImage && !/\.webp(?:$|\?)/.test(localMediaImage.currentSrc)) {
    fail(`media image is not WebP: ${localMediaImage.currentSrc}`);
  }

  await inspectRoute('/cup');
  await inspectRoute('/about');
  console.log(`Image performance validation passed: ${report.fileCount} images, ${report.savedPercent}% saved`);
} finally {
  await context.close();
  await browser.close();
}
