import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON_IDS } from '../config/siteManifest.js';

const root = process.cwd();
const colorPattern = /^#[0-9a-f]{6}$/i;
const fail = (message) => {
  throw new Error(`Team kit validation: ${message}`);
};

for (const seasonId of SEASON_IDS) {
  const teamsPath = join(root, 'data', 'seasons', seasonId, 'teams.json');
  const teams = JSON.parse(readFileSync(teamsPath, 'utf8'));

  for (const team of teams) {
    if (team.kits === undefined) continue;
    if (!team.kits || typeof team.kits !== 'object' || Array.isArray(team.kits)) {
      fail(`${seasonId} ${team.id}: kits must be an object`);
    }

    for (const field of ['home', 'away']) {
      const value = team.kits[field];
      if (typeof value !== 'string' || !colorPattern.test(value)) {
        fail(`${seasonId} ${team.id}: kits.${field} must be a six-digit hex color`);
      }
    }
  }
}

console.log('Team kit colour validation passed');
