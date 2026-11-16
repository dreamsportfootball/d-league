import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const dataRoot = new URL('../data/seasons/2026-27/', import.meta.url);
const readJson = async (filename) => JSON.parse(await readFile(new URL(filename, dataRoot), 'utf8'));
const [teams, players, photoMap] = await Promise.all([
  readJson('teams.json'),
  readJson('players.json'),
  readJson('playerImages.json'),
]);
const visiblePlayers = (teamId) => players.filter(
  (player) => player.teamId === teamId &&
    player.hideFromTeamRoster !== true &&
    player.rosterStatus !== 'INACTIVE_REPLACED',
);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
      locale: 'zh-TW',
      timezoneId: 'Asia/Taipei',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(16000);

    try {
      for (const team of teams) {
        const label = viewport.name + '/' + team.name;
        try {
          const identity = encodeURIComponent(team.identityId ?? team.id);
          await page.goto(base + '/#/teams/' + identity + '?season=2026-27', {
            waitUntil: 'domcontentloaded',
            timeout: 25000,
          });
          const roster = page.getByRole('heading', { name: '球員名單', exact: true })
            .locator('xpath=ancestor::section[1]');
          await roster.waitFor({ state: 'visible' });

          const actual = await roster.locator('a[href*="/players/"]').evaluateAll((links) =>
            links.map((link) => ({
              href: link.getAttribute('href') ?? '',
              name: (link.getAttribute('aria-label') ?? '').replace(/^查看 /, '').replace(/ 球員個人資料$/, ''),
              hasImage: Boolean(link.querySelector('img[src]')),
            })),
          );
          const expected = visiblePlayers(team.id);
          if (actual.length !== expected.length) {
            throw new Error('roster displayed ' + actual.length + ' profiles; expected ' + expected.length);
          }
          const hrefs = actual.map((item) => item.href);
          if (new Set(hrefs).size !== hrefs.length) {
            throw new Error('same player profile appears more than once');
          }
          const displayedIds = new Set(hrefs.map((href) =>
            decodeURIComponent((href.match(/\/players\/([^?&#]+)/) ?? [])[1] ?? ''),
          ));
          const expectedIds = new Set(expected.map((player) => player.identityId ?? player.id));
          if (displayedIds.size !== expectedIds.size ||
              [...expectedIds].some((id) => !displayedIds.has(id))) {
            throw new Error('displayed player identities do not match the approved roster');
          }

          const missingKnownPhotos = actual.filter(
            (entry) => photoMap[entry.name] && !entry.hasImage,
          );
          if (missingKnownPhotos.length > 0) {
            throw new Error('known player photos not displayed: ' +
              missingKnownPhotos.map((entry) => entry.name).join(', '));
          }

          // Check the real browser-loaded pixels, not only the presence of an img tag.
          // Sampling avoids forcing every lazy portrait on all 18 pages to download.
          const images = roster.locator('a[href*="/players/"] img');
          const count = await images.count();
          const indexes = [...new Set([0, Math.floor(count / 2), count - 1])]
            .filter((index) => index >= 0 && index < count);
          for (const index of indexes) {
            const img = images.nth(index);
            await img.scrollIntoViewIfNeeded();
            const result = await img.evaluate(async (element) => {
              try { await element.decode(); } catch { /* evaluated below */ }
              return { ok: element.naturalWidth > 0, src: element.currentSrc || element.src };
            });
            if (!result.ok) throw new Error('portrait failed to load: ' + result.src);
          }
          console.log('[team-roster] ' + label + ': ' + expected.length + ' unique players');
        } catch (error) {
          failures.push(label + ': ' + error.message);
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  failures.forEach((message) => console.error('[team-roster] FAIL ' + message));
  process.exitCode = 1;
} else {
  console.log('[team-roster] PASS: ' + teams.length + ' teams on mobile and desktop');
}
