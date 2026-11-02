/**
 * Read-only cross-season identity, event, own-goal and scoreboard integrity audit.
 * Do not "fix" old rosters based only on a goal, player name or image folder.
 * Outstanding legacy provenance gaps stay visible in the report.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const errors = [];
const report = { seasons: [], outstandingLegacyEvidence: [], errors };
const unique = (arr) => [...new Set(arr)];
const identityAliases = read('data/playerIdentityAliases.json');
const historical = read('data/playerSeasonHistory.json');
const registeredIdentities = new Map();
let totalOwnGoals = 0, totalPlayers = 0, totalGoalEvents = 0;

for (const seasonId of SEASON_IDS) {
  const path = (name) => `data/seasons/${seasonId}/${name}.json`;
  const players = read(path('players')), teams = read(path('teams'));
  const matches = read(path('matches')), events = read(path('matchEvents'));
  const images = read(path('playerImages'));
  const byPlayerId = new Map(players.map(p => [p.id, p]));
  const byName = new Map();
  for (const p of players) byName.set(p.name, [...(byName.get(p.name) ?? []), p]);
  const teamsById = new Map(teams.map(t => [t.id, t]));
  const matchesById = new Map(matches.map(m => [m.id, m]));
  const aliases = identityAliases[seasonId] ?? {};
  const identities = new Set();
  const legacy = [], ownGoals = [], scoreboardMismatches = [], crossTeam = [], unresolved = [];
  let seasonGoalEvents = 0;

  for (const p of players) {
    if (!teamsById.has(p.teamId)) errors.push(`${seasonId} ${p.id}: missing registered team ${p.teamId}`);
    const canonical = aliases[p.id] ?? p.identityId ?? p.id;
    if (identities.has(canonical)) errors.push(`${seasonId}: duplicate player identity ${canonical}`);
    identities.add(canonical);
    registeredIdentities.set(`${seasonId}:${canonical}`, p.id);
  }
  totalPlayers += players.length;

  for (const [matchId, list] of Object.entries(events)) {
    const match = matchesById.get(matchId);
    if (!match) { errors.push(`${seasonId}: orphan events ${matchId}`); continue; }
    const beneficiaryGoals = { HOME: 0, AWAY: 0 };
    for (const event of list) {
      if (event.type === 'GOAL') {
        seasonGoalEvents++;
        totalGoalEvents++;
        const scorerSide = event.scoringTeam ?? event.team;
        if (!['HOME','AWAY'].includes(scorerSide)) errors.push(`${seasonId} ${event.id}: bad goal side`);
        else beneficiaryGoals[scorerSide]++;
      }
      const legacyOwnGoal = event.isOwnGoal === true && event.scoringTeam === undefined;
      const playerSide = legacyOwnGoal
        ? (event.team === 'HOME' ? 'AWAY' : 'HOME')
        : event.team;
      const playerTeamId = playerSide === 'HOME' ? match.homeTeamId : match.awayTeamId;
      const subjectId = event.playerId ?? event.subjectId;
      const possibles = byName.get(event.player) ?? [];
      const person = subjectId
        ? byPlayerId.get(subjectId)
        : possibles.find(p=>p.teamId===playerTeamId) ?? (possibles.length===1?possibles[0]:undefined);
      if (event.isOwnGoal) {
        totalOwnGoals++;
        ownGoals.push({ matchId, eventId:event.id, player:event.player, playerTeamId, beneficiary: event.scoringTeam ?? event.team });
        if (event.type !== 'GOAL') errors.push(`${seasonId} ${event.id}: own goal not GOAL type`);
        if (event.scoringTeam !== undefined && event.scoringTeam === event.team) {
          errors.push(`${seasonId} ${event.id}: own goal credits player's side`);
        }
      }
      if (!person) {
        if (seasonId==='2025-26') unresolved.push({ matchId, eventId:event.id, name:event.player, playerTeamId });
        else errors.push(`${seasonId} ${event.id}: player could not be resolved`);
      } else if (person.teamId !== playerTeamId && !person.previousTeamIds?.includes(playerTeamId) && !person.registrations?.some(r=>r.teamId===playerTeamId)) {
        if (seasonId==='2025-26') crossTeam.push({ matchId, eventId:event.id, name:event.player, rosterTeamId:person.teamId, eventPlayerTeamId:playerTeamId });
        else errors.push(`${seasonId} ${event.id}: event player differs from registered team`);
      }
    }
    if (match.status==='FINISHED' && match.resultType!=='VOID') {
      const extras=match.unattributedGoals ?? {};
      const actualHome=beneficiaryGoals.HOME+(extras.HOME??0);
      const actualAway=beneficiaryGoals.AWAY+(extras.AWAY??0);
      if (actualHome!==match.homeScore||actualAway!==match.awayScore) {
        scoreboardMismatches.push({matchId,score:[match.homeScore,match.awayScore],credited:[actualHome,actualAway]});
      }
    }
  }
  if(scoreboardMismatches.length)errors.push(`${seasonId}: ${scoreboardMismatches.length} mismatch(es) in scored fixtures`);
  const inferredByImage=[];
  for(const [name,image] of Object.entries(images)) {
    const person=(byName.get(name)??[])[0];if(!person)continue;
    const folder=image.split('/').at(-2);
    const sourceTeam=teams.find(t=>t.name===folder||t.shortName===folder);
    if(sourceTeam&&sourceTeam.id!==person.teamId)inferredByImage.push({
      name,rosterTeamId:person.teamId,imageFolderTeamId:sourceTeam.id,
    });
  }
  if(seasonId==='2025-26') {
    // These records are not proof of a transfer; they need historical source
    // review, not automatic reassignment.
    report.outstandingLegacyEvidence.push(...unresolved.map(x=>({kind:'unresolved_match_player',...x})));
    report.outstandingLegacyEvidence.push(...unique(crossTeam.map(x=>JSON.stringify(x))).map(x=>({kind:'event_vs_roster',...JSON.parse(x)})));
    report.outstandingLegacyEvidence.push(...inferredByImage.map(x=>({kind:'image_folder_vs_roster',...x})));
  }
  report.seasons.push({
    seasonId, players:players.length,teams:teams.length,matches:matches.length,
    finishedMatches:matches.filter(m=>m.status==='FINISHED').length,
    events:Object.values(events).reduce((n,v)=>n+v.length,0),
    goalEvents:seasonGoalEvents,ownGoals,scoreboardMismatches,
    unresolvedEvents:unresolved.length,crossTeamEvents:crossTeam.length,
    imageFolderDifferences:inferredByImage.length,
  });
}
for(const record of historical) {
  const canonical=record.identityId;
  if(registeredIdentities.has(`${record.seasonId}:${canonical}`))errors.push(`duplicate historical season identity ${record.seasonId}:${canonical}`);
}
report.summary={
  seasonPlayerRecords:totalPlayers,
  additionalHistoricalRecords:historical.length,
  goalEvents:totalGoalEvents,
  ownGoals:totalOwnGoals,
  totalUnresolvedProvenance:report.outstandingLegacyEvidence.length,
  verifiedScoreboardMatches:report.seasons.reduce((n,s)=>n+s.finishedMatches-s.scoreboardMismatches.length,0),
};
if(totalPlayers!==507) errors.push(`roster count changed: expected 507, actual ${totalPlayers}; rebaseline intentionally`);
if(totalOwnGoals!==5) errors.push(`own-goal count changed: expected 5, actual ${totalOwnGoals}; audit new goals`);
mkdirSync(join(root,'audit'),{recursive:true});
writeFileSync(join(root,'audit/player-history-integrity-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,seasonChecks:report.seasons.map(({ownGoals,...rest})=>rest),outstandingLegacyEvidence:report.outstandingLegacyEvidence,errors},null,2));
if(errors.length)process.exitCode=1;
