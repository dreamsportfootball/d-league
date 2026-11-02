import fs from 'node:fs';
import path from 'node:path';
import { SEASON_IDS, CURRENT_SEASON_ID } from '../config/siteManifest.js';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const aliases = read('data/playerIdentityAliases.json');
const seasons = Object.fromEntries(SEASON_IDS.map(id => [id, {
  players: read(`data/seasons/${id}/players.json`),
  images: read(`data/seasons/${id}/playerImages.json`),
  teams: read(`data/seasons/${id}/teams.json`),
}]));
const identity = (seasonId, player) =>
  aliases[seasonId]?.[player.id] ?? player.identityId ?? player.id;
const errors = [], unresolvedNames = [], newest = new Map();
let allPlayerRows = 0, verifiedPairs = 0, latestPortraitUses = 0, oldOnlyPortraitUses = 0;

for (const id of [...SEASON_IDS].reverse()) {
  const data = seasons[id];
  const teamIds = new Set(data.teams.map(t => t.id));
  const seenIdentities = new Set();
  const seenNames = new Set();
  for (const player of data.players) {
    allPlayerRows++;
    const key = identity(id, player);
    if (!teamIds.has(player.teamId)) errors.push(`${id} ${player.id}: missing registered team`);
    if (seenIdentities.has(key)) errors.push(`${id} ${player.id}: duplicate canonical identity`);
    seenIdentities.add(key);
    if (seenNames.has(player.name) && data.images[player.name]) {
      errors.push(`${id}: ambiguous name-keyed portrait: ${player.name}`);
    }
    seenNames.add(player.name);
    if (player.hideFromTeamRoster && id === CURRENT_SEASON_ID) {
      errors.push(`${id} ${player.id}: current roster hidden without current-season approval`);
    }
    const image = data.images[player.name];
    if (image && !newest.has(key)) newest.set(key, { image, seasonId: id, playerId: player.id });
  }
}

const newestYear = CURRENT_SEASON_ID;
const current = new Map(seasons[newestYear].players.map(p => [identity(newestYear,p),p]));
const currentByName = new Map(seasons[newestYear].players.map(p => [p.name,p]));
const oldId = SEASON_IDS.find(id=>id!==newestYear);
for (const player of seasons[oldId].players) {
  const key = identity(oldId,player);
  const newer = current.get(key);
  if (newer) {
    verifiedPairs++;
    const expected = seasons[newestYear].images[newer.name] ?? seasons[oldId].images[player.name];
    const chosen = newest.get(key)?.image;
    if (expected && chosen !== expected) {
      errors.push(`${player.id}: wrong latest photo, chose ${chosen}, expected ${expected}`);
    }
    if (seasons[newestYear].images[newer.name]) latestPortraitUses++;
    else oldOnlyPortraitUses++;
  } else if (currentByName.has(player.name)) {
    const other=currentByName.get(player.name);
    unresolvedNames.push({
      name:player.name, priorId:player.id, newId:other.id,
      priorNationality:player.nationality, newNationality:other.nationality,
      note:'Same name is not sufficient evidence of shared identity; do not reuse photo',
    });
    if (newest.get(key)?.image === seasons[newestYear].images[other.name]) {
      errors.push(`${player.id}: photo mixed across unverified same-name identities`);
    }
  }
}

const allTeams = SEASON_IDS.map(seasonId => {
  const data=seasons[seasonId];
  const rosterByTeam=Object.fromEntries(data.teams.map(team => [team.id,0]));
  for(const player of data.players) {
    if(player.hideFromTeamRoster === true)continue;
    rosterByTeam[player.teamId]++;
  }
  return {
    seasonId, teams:data.teams.length, storedPlayers:data.players.length,
    publishedPlayers:Object.values(rosterByTeam).reduce((a,b)=>a+b,0),
    hidden:data.players.filter(p=>p.hideFromTeamRoster === true).map(p=>({id:p.id,name:p.name,teamId:p.teamId})),
  };
});
const expectedHidden=seasons[oldId].players.find(p=>p.id==='ns-51');
if(!expectedHidden?.hideFromTeamRoster||expectedHidden.name!=='蔡軒誠')errors.push('蔡軒誠 should remain in history but be absent from published 鸟仕 roster');
if(verifiedPairs<100)errors.push('Too few verified cross-season identities: '+verifiedPairs);
const report={
  allPlayerRows, verifiedCrossSeasonIdentities:verifiedPairs,
  newerPhotoSelected:latestPortraitUses, newerNoPhotoFallback:oldOnlyPortraitUses,
  unverifiedSameName:unresolvedNames,
  teams:allTeams, errors,
};
fs.mkdirSync('audit',{recursive:true});
fs.writeFileSync(path.join('audit','cross-season-portrait-roster-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length) process.exitCode=1;
