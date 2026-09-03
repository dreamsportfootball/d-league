import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CURRENT_SEASON_ID, SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const fail = (message) => { throw new Error(message); };

const aliases = readJson('data/playerIdentityAliases.json');
const validSeasons = new Set(SEASON_IDS);
const playersBySeason = Object.fromEntries(
  SEASON_IDS.map((seasonId) => [
    seasonId,
    readJson(`data/seasons/${seasonId}/players.json`),
  ]),
);
const teamsBySeason = Object.fromEntries(
  SEASON_IDS.map((seasonId) => [
    seasonId,
    readJson(`data/seasons/${seasonId}/teams.json`),
  ]),
);
const historicalPlayerSeasons = readJson('data/playerSeasonHistory.json');

for (const seasonId of Object.keys(aliases)) {
  if (!validSeasons.has(seasonId)) fail(`player identities: unknown season ${seasonId}`);
  const seasonAliases = aliases[seasonId];
  if (!seasonAliases || typeof seasonAliases !== 'object' || Array.isArray(seasonAliases)) {
    fail(`player identities: ${seasonId} aliases must be an object`);
  }

  const players = playersBySeason[seasonId];
  const playerIds = new Set(players.map((player) => player.id));
  const usedIdentities = new Set();

  for (const [playerId, identityId] of Object.entries(seasonAliases)) {
    if (!playerIds.has(playerId)) fail(`player identities: ${seasonId} unknown player ${playerId}`);
    if (typeof identityId !== 'string' || !identityId.trim()) {
      fail(`player identities: ${seasonId} ${playerId} has invalid identityId`);
    }
    if (usedIdentities.has(identityId)) {
      fail(`player identities: ${seasonId} duplicate canonical identity ${identityId}`);
    }
    usedIdentities.add(identityId);
  }
}

const canonicalBySeason = new Map();
for (const seasonId of SEASON_IDS) {
  const seasonAliases = aliases[seasonId] ?? {};
  const seen = new Set();

  for (const player of playersBySeason[seasonId]) {
    if (seasonId === CURRENT_SEASON_ID && (typeof player.identityId !== 'string' || !player.identityId.trim())) {
      fail(`player identities: ${CURRENT_SEASON_ID} player ${player.id} is missing identityId`);
    }

    const canonicalIdentity = seasonAliases[player.id] ?? player.identityId ?? player.id;
    if (seen.has(canonicalIdentity)) {
      fail(`player identities: ${seasonId} duplicate resolved identity ${canonicalIdentity}`);
    }
    seen.add(canonicalIdentity);
    canonicalBySeason.set(`${seasonId}:${player.id}`, canonicalIdentity);
  }
}

if (!Array.isArray(historicalPlayerSeasons)) {
  fail('player identities: historical player seasons must be an array');
}

const knownCanonicalIdentities = new Set(canonicalBySeason.values());
const historicalIds = new Set();
const historicalSeasonIdentities = new Set();

for (const record of historicalPlayerSeasons) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    fail('player identities: historical player season entry must be an object');
  }
  if (!validSeasons.has(record.seasonId)) {
    fail(`player identities: historical record ${record.id ?? '(unknown)'} has invalid season ${record.seasonId}`);
  }
  if (typeof record.id !== 'string' || !record.id.trim()) {
    fail('player identities: historical player season entry is missing id');
  }
  if (historicalIds.has(record.id)) {
    fail(`player identities: duplicate historical record id ${record.id}`);
  }
  historicalIds.add(record.id);
  if (typeof record.identityId !== 'string' || !record.identityId.trim()) {
    fail(`player identities: historical record ${record.id} is missing identityId`);
  }
  if (!knownCanonicalIdentities.has(record.identityId)) {
    fail(`player identities: historical record ${record.id} has unknown canonical identity ${record.identityId}`);
  }
  if (typeof record.teamId !== 'string' || !teamsBySeason[record.seasonId].some((team) => team.id === record.teamId)) {
    fail(`player identities: historical record ${record.id} has invalid team ${record.teamId}`);
  }
  if (!Number.isInteger(record.number) || record.number < 1) {
    fail(`player identities: historical record ${record.id} has invalid shirt number ${record.number}`);
  }
  if (typeof record.name !== 'string' || !record.name.trim()) {
    fail(`player identities: historical record ${record.id} is missing name`);
  }
  if (typeof record.gender !== 'string' || !record.gender.trim()) {
    fail(`player identities: historical record ${record.id} is missing gender`);
  }
  if (typeof record.nationality !== 'string' || !record.nationality.trim()) {
    fail(`player identities: historical record ${record.id} is missing nationality`);
  }
  if (!Number.isInteger(record.age) || record.age < 0) {
    fail(`player identities: historical record ${record.id} has invalid age ${record.age}`);
  }

  const seasonIdentityKey = `${record.seasonId}:${record.identityId}`;
  if (historicalSeasonIdentities.has(seasonIdentityKey)) {
    fail(`player identities: duplicate historical season identity ${seasonIdentityKey}`);
  }
  historicalSeasonIdentities.add(seasonIdentityKey);

  const seasonAliases = aliases[record.seasonId] ?? {};
  const hasActualSeasonRecord = playersBySeason[record.seasonId].some((player) =>
    (seasonAliases[player.id] ?? player.identityId ?? player.id) === record.identityId
  );
  if (hasActualSeasonRecord) {
    fail(`player identities: historical record ${record.id} duplicates an actual ${record.seasonId} player record`);
  }
}

console.log(`player identities: ${canonicalBySeason.size} season-player records validated`);
