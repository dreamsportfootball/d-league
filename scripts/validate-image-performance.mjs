import { readFile, writeFile } from 'node:fs/promises';
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
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});
const desktopContext = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
  serviceWorkers: 'block',
});

const inspectRoute = async (context, route) => {
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#root > *', { timeout: 12000 });
    await page.waitForTimeout(700);

    const result = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      preloads: [...document.querySelectorAll('link[data-home-hero-preload="true"]')].map((link) => ({
        href: link.href,
        as: link.getAttribute('as') ?? '',
        type: link.getAttribute('type') ?? '',
        fetchPriority: link.getAttribute('fetchpriority') ?? '',
      })),
      posterResources: performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes('registration-poster-'))
        .map((entry) => ({
          name: entry.name,
          initiatorType: entry.initiatorType,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: 'transferSize' in entry ? entry.transferSize : 0,
        })),
      registrationPictureClass:
        document.querySelector('img[alt*="正式報名開放"]')?.parentElement?.getAttribute('class') ?? '',
      images: [...document.images].map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          alt: image.alt,
          src: image.getAttribute('src') ?? '',
          currentSrc: image.currentSrc,
          loading: image.loading,
          decoding: image.decoding,
          fetchPriority: image.getAttribute('fetchpriority') ?? '',
          width: image.getAttribute('width') ?? '',
          height: image.getAttribute('height') ?? '',
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

const validateHomeHero = (result, expectedFileName) => {
  const hero = result.images.find(
    (image) => image.alt.includes('正式報名開放') || image.alt.includes('主視覺'),
  );
  if (!hero) fail('homepage hero image was not found');
  if (!/\.webp(?:$|\?)/.test(hero.currentSrc)) fail(`homepage hero is not WebP: ${hero.currentSrc}`);
  if (hero.loading !== 'eager' || hero.fetchPriority !== 'high') {
    fail('homepage hero is not prioritized');
  }
  if (hero.width !== '1920' || hero.height !== '800') {
    fail(`homepage hero dimensions are not reserved: ${hero.width}x${hero.height}`);
  }
  if (result.registrationPictureClass.includes('opacity-0') || result.registrationPictureClass.includes('transition-opacity')) {
    fail('registration hero still starts hidden behind an opacity transition');
  }

  if (result.preloads.length !== 1) {
    fail(`homepage should create exactly one hero preload, received ${result.preloads.length}`);
  }
  const preload = result.preloads[0];
  if (!preload.href.endsWith(`/assets/seasons/2026-27/${expectedFileName}.webp`)) {
    fail(`homepage preloaded the wrong hero: ${preload.href}`);
  }
  if (preload.as !== 'image' || preload.type !== 'image/webp' || preload.fetchPriority !== 'high') {
    fail('homepage hero preload is missing image type or high priority');
  }
  if (hero.currentSrc !== preload.href) {
    fail(`hero preload does not match the rendered image: ${preload.href} vs ${hero.currentSrc}`);
  }
  if (result.posterResources.length !== 1) {
    fail(`homepage downloaded ${result.posterResources.length} hero poster resources instead of one`);
  }
  if (!result.posterResources[0].name.endsWith(`${expectedFileName}.webp`)) {
    fail(`homepage downloaded the wrong hero resource: ${result.posterResources[0].name}`);
  }
};

try {
  const mobileHome = await inspectRoute(mobileContext, '/');
  const desktopHome = await inspectRoute(desktopContext, '/');

  await writeFile(
    'hero-performance-diagnostics.json',
    JSON.stringify({ mobileHome, desktopHome }, null, 2),
    'utf8',
  );

  validateHomeHero(mobileHome, 'registration-poster-mobile');
  validateHomeHero(desktopHome, 'registration-poster-desktop');

  const news = await inspectRoute(mobileContext, '/news');
  if (news.preloads.length !== 0 || news.posterResources.length !== 0) {
    fail('non-home routes should not preload the homepage poster');
  }
  const localNewsImage = news.images.find((image) => image.currentSrc.includes('/assets/'));
  if (localNewsImage && !/\.webp(?:$|\?)/.test(localNewsImage.currentSrc)) {
    fail(`news image is not WebP: ${localNewsImage.currentSrc}`);
  }

  const media = await inspectRoute(mobileContext, '/media?season=2025-26');
  const localMediaImage = media.images.find((image) => image.currentSrc.includes('/assets/'));
  if (localMediaImage && !/\.webp(?:$|\?)/.test(localMediaImage.currentSrc)) {
    fail(`media image is not WebP: ${localMediaImage.currentSrc}`);
  }

  await inspectRoute(mobileContext, '/cup');
  await inspectRoute(mobileContext, '/about');
  console.log(`Image performance validation passed: ${report.fileCount} images, ${report.savedPercent}% saved`);
} finally {
  await mobileContext.close();
  await desktopContext.close();
  await browser.close();
}
