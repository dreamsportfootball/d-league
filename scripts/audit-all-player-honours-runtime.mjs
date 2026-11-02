// Check every distinct player identity against the ACTUAL Vite-transformed
// honours, player history and personal-goals functions, not a copied algorithm.
// Runs against the source Vite dev server in CI, without altering public UI.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const server = (process.env.AUDIT_SOURCE_URL ?? 'http://127.0.0.1:4174/d-league').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
let report;
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'zh-TW', timezoneId: 'Asia/Taipei', serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(server + '/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  report = await page.evaluate(async () => {
    const [
      entity, honoursApi, source, eventTeamApi,
    ] = await Promise.all([
      import('/d-league/services/entityData.ts'),
      import('/d-league/services/playerHonours.ts'),
      import('/d-league/services/seasonDataJson.ts'),
      import('/d-league/utils/matchEventTeam.ts'),
    ]);
    const seasons = ['2025-26', '2026-27'];
    const ids = new Set();
    const anomalies = [];
    let seasonPlayerRecords = 0;
    const result = { seasonPlayerRecords: 0, canonicalPlayers: 0,
      playerSeasonRecordsChecked: 0, honourRecordsChecked: 0,
      personalGoalsChecked: 0, anomalies };
    for (const seasonId of seasons) {
      for (const player of source.getSeasonData(seasonId).players) {
        seasonPlayerRecords++;
        ids.add(entity.getPlayerIdentity(player));
      }
    }
    result.seasonPlayerRecords = seasonPlayerRecords;
    result.canonicalPlayers = ids.size;

    for (const canonicalId of ids) {
      const history = entity.getPlayerHistory(canonicalId);
      const honours = honoursApi.getPlayerHonours(canonicalId);
      const leagueHonours = honours.filter(h=>h.kind==='LEAGUE_CHAMPION'||h.kind==='LEAGUE_RUNNER_UP');
      const honourIds = new Set();
      for (const h of honours) {
        if (honourIds.has(h.id)) anomalies.push({id:canonicalId,reason:'duplicate_honour',honour:h.id});
        honourIds.add(h.id);
      }
      result.honourRecordsChecked += honours.length;
      const representedBySeason = new Map();
      for (const record of history) {
        result.playerSeasonRecordsChecked++;
        const teams = new Set([record.player.teamId, ...(record.player.previousTeamIds ?? [])]);
        for (const r of record.player.registrations??[]) teams.add(r.teamId);
        for (const [matchId, lineup] of Object.entries(record.data.lineups)) {
          const match = record.data.matches.find(m=>m.id===matchId);
          if (!match) continue;
          if (lineup?.homePlayerIds?.includes(record.player.id)) teams.add(match.homeTeamId);
          if (lineup?.awayPlayerIds?.includes(record.player.id)) teams.add(match.awayTeamId);
        }
        let goals=0;
        for (const [matchId, events] of Object.entries(record.data.matchEvents)) {
          const match = record.data.matches.find(m=>m.id===matchId);
          if (!match) continue;
          for (const ev of events) {
            if (entity.resolveMatchEventPlayer(record.data, match, ev)?.id !== record.player.id) continue;
            teams.add(eventTeamApi.getMatchEventPlayerTeamId(match, ev));
            if (ev.type==='GOAL'&&!ev.isOwnGoal&&match.resultType!=='VOID'&&match.countsForPlayerStats!==false)goals++;
          }
        }
        const actual = entity.getPlayerSeasonStats(record).goals;
        result.personalGoalsChecked++;
        if (actual!==goals)anomalies.push({id:canonicalId,seasonId:record.seasonId,reason:'personal_goal_mismatch',actual,expected:goals});
        representedBySeason.set(record.seasonId,teams);
      }
      for (const h of leagueHonours) {
        if (!representedBySeason.get(h.seasonId)?.has(h.teamId)) {
          anomalies.push({id:canonicalId,reason:'award_to_unrepresented_team',seasonId:h.seasonId,team:h.teamId,title:h.title});
        }
      }
      if (canonicalId==='cy-12' && leagueHonours.some(h=>h.seasonId==='2025-26'&&h.teamId==='t_chen')) {
        anomalies.push({id:canonicalId,reason:'Zheng_wrong_Chen_champion'});
      }
      if (canonicalId==='pt-43' && history.some(r=>r.seasonId==='2026-27'&&entity.getPlayerSeasonStats(r).goals!==0)) {
        anomalies.push({id:canonicalId,reason:'Chen_own_goal_counted'});
      }
    }
    return result;
  });
  await context.close();
} catch (error) {
  report = { fatal: String(error?.stack ?? error), anomalies: [] };
  process.exitCode = 1;
} finally {
  await browser.close();
}
mkdirSync('audit', { recursive: true });
writeFileSync(join('audit','player-honours-runtime-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (report.anomalies?.length || report.fatal || report.seasonPlayerRecords !== 507) {
  process.exitCode = 1;
}
