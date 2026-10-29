import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const outputDir = resolve('line-matchday-kit-2026-11-01');
const cases = [
  { id: 'm2627-001', home: '陳公舘', away: '台南長青足球俱樂部', time: '0900' },
  { id: 'm2627-002', home: 'KUROMI', away: '阿蓮FC', time: '1000' },
  { id: 'm2627-003', home: '嘉義 235 FC', away: '高雄黑騎士足球隊', time: '1100' },
  { id: 'm2627-004', home: '銅雀', away: '高雄業餘足球俱樂部', time: '1315' },
  { id: 'm2627-005', home: '高雄香港人足球俱樂部', away: '黑狼FC', time: '1415' },
  { id: 'm2627-006', home: 'SOUTHBOYS FC', away: '屏東野猿足球俱樂部', time: '1515' },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const records = [];

try {
  for (const fixture of cases) {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 850 },
      deviceScaleFactor: 2,
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
    });

    try {
      const url = baseUrl + '/#/schedule?season=2026-27&match=' + fixture.id;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const dialog = page.locator('[role="dialog"][aria-modal="true"]');
      await dialog.locator('#match-dialog-title').waitFor({ state: 'visible', timeout: 25000 });

      const text = await dialog.innerText();
      if (!text.includes(fixture.home) || !text.includes(fixture.away)) {
        throw new Error(fixture.id + ': team names did not match screenshot source');
      }

      const miniKits = dialog.locator('img[title*="球衣"]');
      await miniKits.first().waitFor({ state: 'visible', timeout: 15000 });
      if (await miniKits.count() !== 2) {
        throw new Error(fixture.id + ': expected two mini-kit images');
      }

      if (fixture.id === 'm2627-004') {
        const kitTitle = await miniKits.nth(1).getAttribute('title');
        if (!kitTitle?.includes('主場球衣')) {
          throw new Error(fixture.id + ': guest team must show red home kit');
        }
      }

      await page.evaluate(async () => {
        await document.fonts.ready;
        const photos = Array.from(document.querySelectorAll('[role="dialog"] img'));
        await Promise.all(photos.slice(0, 6).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((done) => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
        }));
      });

      const kitImages = await miniKits.evaluateAll((imgs) =>
        imgs.map((img) => ({ title: img.title, width: img.naturalWidth, visible: getComputedStyle(img).display !== 'none' })),
      );
      if (kitImages.some((img) => img.width === 0 || !img.visible)) {
        throw new Error(fixture.id + ': mini-kit image did not load: ' + JSON.stringify(kitImages));
      }

      const logoImages = dialog.locator('a[href*="/teams/"] > img');
      const logos = await logoImages.evaluateAll((imgs) =>
        imgs.slice(0, 2).map((img) => ({ alt: img.alt, width: img.naturalWidth })),
      );
      if (logos.length < 2 || logos.some((img) => img.width === 0)) {
        throw new Error(fixture.id + ': club logo did not load');
      }

      const title = dialog.locator('#match-dialog-title');
      const grid = title.locator('xpath=../..');
      const heading = grid.locator('xpath=preceding-sibling::div[1]');
      const headingBox = await heading.boundingBox();
      const gridBox = await grid.boundingBox();

      if (!headingBox || !gridBox) throw new Error(fixture.id + ': missing DOM bounds');
      const clipX = Math.max(0, Math.floor(Math.min(headingBox.x, gridBox.x) - 16));
      const clipY = Math.max(0, Math.floor(headingBox.y - 8));
      const clipRight = Math.min(1024, Math.ceil(Math.max(headingBox.x + headingBox.width, gridBox.x + gridBox.width) + 16));
      const clipBottom = Math.min(850, Math.ceil(gridBox.y + gridBox.height + 12));
      const clip = { x: clipX, y: clipY, width: clipRight - clipX, height: clipBottom - clipY };

      if (clip.width < 400 || clip.height < 160 || clip.height > 450) {
        throw new Error(fixture.id + ': unexpected crop bounds ' + JSON.stringify(clip));
      }

      await dialog.locator('button[aria-label="關閉"]').evaluate((el) => { el.style.visibility = 'hidden'; });
      const filename = fixture.id + '_' + fixture.time + '.png';
      await page.screenshot({ path: resolve(outputDir, filename), type: 'png', clip, animations: 'disabled' });

      records.push({ id: fixture.id, time: fixture.time, home: fixture.home, away: fixture.away, filename, clip, kitImages, logos });
      console.log('Captured ' + filename + ' (' + Math.round(clip.width * 2) + 'x' + Math.round(clip.height * 2) + ')');
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (records.length !== 6) throw new Error('Missing screenshot files: ' + records.length);
await writeFile(resolve(outputDir, 'capture-manifest.json'), JSON.stringify(records, null, 2) + '\n');
console.log('Captured all six match details using the original website DOM.');
