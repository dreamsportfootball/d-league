import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CURRENT_SEASON_ID } from '../config/siteManifest.js';

const root = process.cwd();
const seasonRoot = join(root, 'data', 'seasons', CURRENT_SEASON_ID);
const read = (fileName) => JSON.parse(readFileSync(join(seasonRoot, fileName), 'utf8'));
const fail = (message) => {
  throw new Error(`${CURRENT_SEASON_ID} participants: ${message}`);
};

const participants = read('participants.json');
const teamBranding = read('teamBranding.json');
const news = read('news.json');
const highlights = read('highlights.json');
const leagueIds = ['L1', 'L2', 'L3'];
const colorPattern = /^#[0-9a-f]{6}$/i;
const logoFilePattern = /^[a-z0-9][a-z0-9-]*\.(png|webp|svg)$/i;

if (!participants || typeof participants !== 'object' || Array.isArray(participants)) {
  fail('participants.json must contain an object');
}

if (Number.isNaN(new Date(participants.confirmedAt).getTime())) {
  fail('confirmedAt must be a valid date');
}

if (!participants.leagues || typeof participants.leagues !== 'object' || Array.isArray(participants.leagues)) {
  fail('leagues must contain an object');
}

const configuredLeagueIds = Object.keys(participants.leagues).sort();
if (JSON.stringify(configuredLeagueIds) !== JSON.stringify([...leagueIds].sort())) {
  fail(`expected leagues ${leagueIds.join(', ')}`);
}

const allTeams = [];
for (const leagueId of leagueIds) {
  const teams = participants.leagues[leagueId];
  if (!Array.isArray(teams)) fail(`${leagueId} must contain a team array`);
  if (teams.length !== 6) fail(`${leagueId} must contain exactly 6 teams`);

  for (const team of teams) {
    if (typeof team !== 'string' || !team.trim()) fail(`${leagueId} contains an invalid team name`);
    allTeams.push(team.trim());
  }
}

if (allTeams.length !== 18) fail('expected exactly 18 confirmed teams');
if (new Set(allTeams).size !== allTeams.length) fail('team names must be unique across all leagues');
if (allTeams.includes('石門聯隊')) fail('withdrawn team 石門聯隊 must not appear in confirmed participants');

if (!teamBranding || typeof teamBranding !== 'object' || Array.isArray(teamBranding)) {
  fail('teamBranding.json must contain an object');
}
const brandingNames = Object.keys(teamBranding).sort();
const participantNames = [...allTeams].sort();
if (JSON.stringify(brandingNames) !== JSON.stringify(participantNames)) {
  fail('teamBranding.json must define exactly the 18 confirmed teams');
}
for (const [teamName, branding] of Object.entries(teamBranding)) {
  if (!branding || typeof branding !== 'object' || Array.isArray(branding)) {
    fail(`${teamName}: branding must be an object`);
  }
  if (typeof branding.logoFile !== 'string' || !logoFilePattern.test(branding.logoFile)) {
    fail(`${teamName}: invalid logoFile ${branding.logoFile ?? ''}`);
  }
  for (const field of ['primaryColor', 'secondaryColor']) {
    if (branding[field] !== undefined && (typeof branding[field] !== 'string' || !colorPattern.test(branding[field]))) {
      fail(`${teamName}: ${field} must be a six-digit hex color`);
    }
  }
}

for (const field of ['note', 'nextStep', 'detailsNote']) {
  if (typeof participants[field] !== 'string' || !participants[field].trim()) {
    fail(`${field} is required`);
  }
}

if (!Array.isArray(participants.deadlines) || participants.deadlines.length === 0) {
  fail('at least one deadline is required');
}
for (const deadline of participants.deadlines) {
  if (!deadline?.label?.trim() || Number.isNaN(new Date(deadline.deadline).getTime())) {
    fail('deadline entries require a label and valid date');
  }
}

const announcementId = `${CURRENT_SEASON_ID}-confirmed-teams-and-divisions`;
const announcement = news.find((article) => article.id === announcementId);
if (!announcement) fail(`required announcement ${announcementId} is missing`);
if (!highlights[announcementId]?.trim()) fail(`highlight ${announcementId} is missing`);

for (const leagueId of leagueIds) {
  if (!announcement.content.includes(`【${leagueId}】`)) {
    fail(`announcement is missing ${leagueId} heading`);
  }
}
for (const team of allTeams) {
  if (!announcement.content.includes(team)) {
    fail(`announcement is missing team ${team}`);
  }
}

console.log(`${CURRENT_SEASON_ID}: ${allTeams.length} confirmed teams across ${leagueIds.length} leagues`);
console.log('Participant and team branding validation passed');
