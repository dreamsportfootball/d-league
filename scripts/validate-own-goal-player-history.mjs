import { chromium } from 'playwright';

const base = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/, '');
// In 2025/26 own-goal event.team identifies the team benefiting from the goal.
// It MUST NOT create a false career-team entry for the scorer.
const ownGoals = [
  { id: 'cy-12', name: '鄭州偉', correct: 'chiayi-235-fc', wrong: 't_chen' },
  { id: 'cl-19', name: '林湧鈞', correct: 'wanderers', wrong: 't_pingtung' },
  { id: 'tq-16', name: '巫嘉德', correct: 't_tongque', wrong: 't_chen' },
  { id: 'lz-29', name: '陳泰盛', correct: 't_luzhu', wrong: 't_ppi' },
];
const browser = await chromium.launch({ headless: true });
const problems = [];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({
      viewport, timezoneId: 'Asia/Taipei', locale: 'zh-TW', serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      for (const person of ownGoals) {
        try {
          await page.goto(`${base}/#/players/${person.id}?season=2025-26`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const career = page.locator('section').filter({ has: page.getByRole('heading', { name: 'D LEAGUE 生涯' }) });
          await career.waitFor({ state: 'visible', timeout: 20000 });
          const links = await career.locator('a[href*="/teams/"][href*="season=2025-26"]').evaluateAll(
            (elements) => elements.map((el) => ({ href: el.getAttribute('href') ?? '', text: el.textContent?.trim() ?? '' })),
          );
          if (!links.length) throw new Error('no 2025/26 career team link');
          if (!links.some((item) => item.href.includes(`/teams/${person.correct}?season=2025-26`))) {
            throw new Error('missing registered team: ' + JSON.stringify(links));
          }
          if (links.some((item) => item.href.includes(`/teams/${person.wrong}?season=2025-26`))) {
            throw new Error('incorrect own-goal beneficiary shown as career team: ' + JSON.stringify(links));
          }
          // Career honours must use the same actual-team attribution as the
          // career table: no opponent champion/runner-up award for an own goal.
          const honourSection = page.locator('section').filter({
            has: page.getByRole('heading', { name: '榮譽', exact: true }),
          });
          const honourText = await honourSection.allInnerTexts();
          const prohibitedTeam = person.id === 'cy-12' ? '陳公舘'
            : person.id === 'tq-16' ? '陳公舘'
              : person.id === 'cl-19' ? '屏東野猿'
                : 'PPI';
          if (honourText.some((text) => text.includes(prohibitedTeam))) {
            throw new Error('opponent incorrectly received league/cup honour: ' + JSON.stringify(honourText));
          }
          if (person.id === 'cy-12') {
            await page.goto(`${base}/#/players/${person.id}?season=2026-27`, { waitUntil: 'domcontentloaded' });
            const currentCareer = page.locator('section').filter({ has: page.getByRole('heading', { name: 'D LEAGUE 生涯' }) });
            await currentCareer.waitFor({ state: 'visible' });
            const currentLinks = await currentCareer.locator('a[href*="/teams/"][href*="season=2026-27"]').evaluateAll(
              (elements) => elements.map((el) => el.getAttribute('href') ?? ''),
            );
            if (!currentLinks.some((href) => href.includes('/teams/chiayi-235-fc?season=2026-27'))) {
              throw new Error('current-season Chiayi 235 record missing: ' + JSON.stringify(currentLinks));
            }
          }
          console.log(`[own-goal-career] ${viewport.width}px ${person.name} passed`);
        } catch (error) {
          problems.push(`${viewport.width}px / ${person.name}: ${error.message}`);
        }
      }
    } finally {
      await context.close();
    }
  // 2026/27 encodes event.team as the player's team and scoringTeam as
  // the beneficiary. The own-goal scorer must NOT be moved to SOUTHBOYS.
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 }, timezoneId: 'Asia/Taipei',
      locale: 'zh-TW', serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      await page.goto(`${base}/#/players/pt-43?season=2026-27`, {
        waitUntil: 'domcontentloaded', timeout: 30000,
      });
      const career = page.locator('section').filter({
        has: page.getByRole('heading', { name: 'D LEAGUE 生涯' }),
      });
      await career.waitFor({ state: 'visible', timeout: 20000 });
      const links = await career.locator('a[href*="/teams/"][href*="season=2026-27"]').evaluateAll(
        (elements) => elements.map((el) => el.getAttribute('href') ?? ''),
      );
      if (!links.some((href) => href.includes('/teams/t_pingtung?season=2026-27'))) {
        problems.push(`${width}px / 陳奕盛: missing registered team ${JSON.stringify(links)}`);
      }
      if (links.some((href) => href.includes('/teams/southboys-fc?season=2026-27'))) {
        problems.push(`${width}px / 陳奕盛: own goal incorrectly implies SOUTHBOYS transfer`);
      }
      const score = await page.locator('dt').filter({ hasText: /^進球$/ }).first()
        .locator('xpath=following-sibling::dd').first().innerText();
      if (score.trim() !== '0') {
        problems.push(`${width}px / 陳奕盛: own goal credited as player goal (display=${score})`);
      }
    } catch (error) {
      problems.push(`${width}px / 2026/27 own goal: ${error.message}`);
    } finally {
      await context.close();
    }
  }
  }
} finally {
  await browser.close();
}
if (problems.length) {
  problems.forEach((problem) => console.error('[own-goal-career] ' + problem));
  process.exitCode = 1;
} else {
  console.log('[own-goal-career] all 4 own-goal players mapped to their registered team on mobile and desktop');
}
