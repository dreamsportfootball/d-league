import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CURRENT_SEASON_ID } from '../config/siteManifest.js';

const dir = join(process.cwd(), 'data/seasons', CURRENT_SEASON_ID);
const importsDir = join(dir, 'registrationImports');
const teamsPath = join(dir, 'teams.json');
const playersPath = join(dir, 'players.json');
const fail = (reason) => { throw new Error('registration imports: ' + reason); };
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--replace-existing')) fail('unsupported argument (only --replace-existing allowed)');
const replace = args.includes('--replace-existing');
if (!existsSync(importsDir)) {
  console.log('registration imports: no import directory');
  process.exit(0);
}

const files = readdirSync(importsDir).filter((name) => name.endsWith('.json')).sort();
const sourceTeams = readFileSync(teamsPath, 'utf8');
const sourcePlayers = readFileSync(playersPath, 'utf8');
let teams = JSON.parse(sourceTeams);
let players = JSON.parse(sourcePlayers);
let added = 0;
let replaced = 0;
let retained = 0;
let unchanged = 0;
const importedTeamIds = new Set();

for (const fileName of files) {
  const payload = JSON.parse(readFileSync(join(importsDir, fileName), 'utf8'));
  const team = payload?.team;
  if (!team || typeof team !== 'object' || Array.isArray(team)) fail(fileName + ': missing team');
  if (!Array.isArray(payload.players)) fail(fileName + ': missing players');
  if (team.seasonId !== CURRENT_SEASON_ID) fail(fileName + ': wrong season');
  if (typeof team.id !== 'string' || !team.id.trim()) fail(fileName + ': invalid team id');
  if (typeof team.identityId !== 'string' || !team.identityId.trim()) fail(fileName + ': invalid team identityId');
  if (importedTeamIds.has(team.id)) fail(fileName + ': duplicate team import');
  importedTeamIds.add(team.id);

  const ids = new Set();
  const identities = new Set();
  const numbers = new Set();
  const incoming = payload.players.map((p, index) => {
    const label = fileName + ' player ' + (index + 1);
    if (!p || typeof p !== 'object' || Array.isArray(p)) fail(label + ': invalid player');
    if (p.teamId !== team.id) fail(label + ': teamId mismatch');
    if (typeof p.id !== 'string' || !p.id.trim() || ids.has(p.id)) fail(label + ': invalid/duplicate player id');
    ids.add(p.id);
    if (typeof p.identityId !== 'string' || !p.identityId.trim() || identities.has(p.identityId)) fail(label + ': invalid/duplicate identityId');
    identities.add(p.identityId);
    if (typeof p.name !== 'string' || !p.name.trim()) fail(label + ': missing name');
    if (p.number !== null && (!Number.isInteger(p.number) || p.number < 1 || p.number > 99)) fail(label + ': invalid shirt number');
    if (p.number !== null) {
      if (numbers.has(p.number)) fail(label + ': duplicate shirt number');
      numbers.add(p.number);
    }
    return { ...p, number: p.number ?? 0 };
  });

  const current = teams.find((t) => t.id === team.id);
  const identityMatch = teams.find((t) => t.identityId === team.identityId);
  if ((current && current.identityId !== team.identityId) ||
      (identityMatch && identityMatch.id !== team.id)) {
    fail(fileName + ': conflicting team identity');
  }

  // Once a team's canonical record exists, it is authoritative. An older
  // registration package cannot overwrite later shirt/name/staff edits.
  if (current && !replace) {
    const sortPlayers = (list) => [...list].sort((a, b) => a.id.localeCompare(b.id));
    const same = JSON.stringify(current) === JSON.stringify(team) &&
      JSON.stringify(sortPlayers(players.filter((p) => p.teamId === team.id))) === JSON.stringify(sortPlayers(incoming));
    if (same) unchanged += 1;
    else {
      retained += 1;
      console.warn('registration imports: ' + fileName + ': canonical roster retained; review diff before --replace-existing');
    }
    continue;
  }

  const unaffected = players.filter((p) => p.teamId !== team.id);
  const unaffectedIds = new Set(unaffected.map((p) => p.id));
  const unaffectedIdentities = new Set(unaffected.map((p) => p.identityId).filter(Boolean));
  for (const p of incoming) {
    if (unaffectedIds.has(p.id) || unaffectedIdentities.has(p.identityId)) {
      fail(fileName + ': player identity belongs to another team: ' + p.id);
    }
  }

  teams = [...teams.filter((t) => t.id !== team.id), team];
  players = [...unaffected, ...incoming];
  if (current) replaced += 1;
  else added += 1;
}

// Validate all imported JSON files before writing either canonical file.
if (added + replaced) {
  const nextTeams = JSON.stringify(teams, null, 2) + '\n';
  const nextPlayers = JSON.stringify(players, null, 2) + '\n';
  if (nextTeams !== sourceTeams) writeFileSync(teamsPath, nextTeams);
  if (nextPlayers !== sourcePlayers) writeFileSync(playersPath, nextPlayers);
}
console.log('registration imports: added ' + added + ', replaced ' + replaced +
  ', retained ' + retained + ', unchanged ' + unchanged + ' team(s)');
