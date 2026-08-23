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

console.log(`player identities: ${canonicalBySeason.size} season-player records validated`);
