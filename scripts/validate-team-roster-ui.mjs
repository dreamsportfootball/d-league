import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
const dataRoot = new URL('../data/seasons/2026-27/', import.meta.url);
const readJson = async (filename) => JSON.parse(await readFile(new URL(filename, dataRoot), 'utf8'));
const [teams, players, photoMap, matches] = await Promise.all([
  readJson('teams.json'),
  readJson('players.json'),
  readJson('playerImages.json'),
  readJson('matches.json'),
]);
const identityAliases = JSON.parse(await readFile(new URL('../data/playerIdentityAliases.json', import.meta.url), 'utf8'))['2026-27'] ?? {};
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

          // Preserve the existing team page and verify the two new football-info
          // summaries are derived from confirmed season data, never made up.
          const teamMatches = matches
            .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
            .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
          const expectedNext = teamMatches.find(
            (match) => match.status === 'SCHEDULED' && Date.parse(match.timestamp) >= Date.now(),
          );
          const expectedLast = teamMatches.filter(
            (match) => match.status === 'FINISHED' &&
              match.homeScore !== null && match.awayScore !== null &&
              match.resultType !== 'VOID',
          ).slice(-1)[0];
          const actualNext = await page.locator('[data-team-next-match]').first().getAttribute('data-team-next-match');
          const actualLast = await page.locator('[data-team-last-result]').first().getAttribute('data-team-last-result');
          if (actualNext !== (expectedNext?.id ?? null) || actualLast !== (expectedLast?.id ?? null)) {
            throw new Error('team next/last summary differs from confirmed fixtures: ' +
              JSON.stringify({ actualNext, expectedNext: expectedNext?.id, actualLast, expectedLast: expectedLast?.id }));
          }
          if ((expectedNext || expectedLast) && await page.getByLabel('球隊賽事摘要').count() !== 1) {
            throw new Error('team summary missing');
          }

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
          const expectedIds = new Set(expected.map((player) => identityAliases[player.id] ?? player.identityId ?? player.id));
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
