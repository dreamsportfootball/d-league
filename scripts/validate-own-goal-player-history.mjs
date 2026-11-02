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
