import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../apply-registration-imports.mjs', import.meta.url));
const season = '2026-27';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'd-league-import-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const folder = join(root, 'data/seasons', season);
  const imports = join(folder, 'registrationImports');
  mkdirSync(imports, { recursive: true });
  const teams = join(folder, 'teams.json');
  const players = join(folder, 'players.json');
  const write = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
  const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
  const originalTeam = { id: 'other', identityId: 'other-identity', seasonId: season, name: 'Other' };
  const originalPlayer = { id: 'other-1', identityId: 'other-person', teamId: 'other', name: 'Other Player', number: 9 };
  const payload = { team: { id: 'new', identityId: 'new-identity', seasonId: season, name: 'New' },
    players: [{ id: 'new-1', identityId: 'new-person', teamId: 'new', name: 'Player A', number: 7 },
      { id: 'new-2', identityId: 'new-person-2', teamId: 'new', name: 'Player B', number: null }] };
  write(teams, [originalTeam]); write(players, [originalPlayer]);
  write(join(imports, 'new.json'), payload);
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  return { teams, players, imports, payload, write, read, run };
}
test('import new team and rerun without touching canonical JSON', (t) => {
  const f = fixture(t); assert.equal(f.run().status, 0);
  assert.equal(f.read(f.players).find(p => p.id === 'new-2').number, 0);
  const before = [readFileSync(f.teams, 'utf8'), readFileSync(f.players, 'utf8')];
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /unchanged 1/);
  assert.deepEqual([readFileSync(f.teams, 'utf8'), readFileSync(f.players, 'utf8')], before);
});
test('later shirt updates survive stale imports', (t) => {
  const f = fixture(t); assert.equal(f.run().status, 0);
  const current = f.read(f.players);
  current.find(p => p.id === 'new-1').number = 35;
  f.write(f.players, current);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /canonical roster retained/);
  assert.equal(f.read(f.players).find(p => p.id === 'new-1').number, 35);
});
test('explicit replacement is the only way to overwrite canonical edits', (t) => {
  const f = fixture(t); assert.equal(f.run().status, 0);
  const current = f.read(f.players);
  current.find(p => p.id === 'new-1').number = 35;
  f.write(f.players, current);
  assert.equal(f.run('--replace-existing').status, 0);
  assert.equal(f.read(f.players).find(p => p.id === 'new-1').number, 7);
});
test('another team player identity cannot be silently stolen', (t) => {
  const f = fixture(t);
  f.payload.players[0].id = 'other-1';
  f.write(join(f.imports, 'new.json'), f.payload);
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /player identity belongs to another team/);
  assert.equal(f.read(f.players).length, 1);
});
test('invalid later import does not partially write earlier imports', (t) => {
  const f = fixture(t);
  f.write(join(f.imports, 'zz-bad.json'), { team: { id: 'bad', identityId: 'bad', seasonId: season },
    players: [{ id: 'a', identityId: 'a', teamId: 'bad', name: 'A', number: 5 },
      { id: 'b', identityId: 'b', teamId: 'bad', name: 'B', number: 5 }] });
  const before = [readFileSync(f.teams, 'utf8'), readFileSync(f.players, 'utf8')];
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate shirt number/);
  assert.deepEqual([readFileSync(f.teams, 'utf8'), readFileSync(f.players, 'utf8')], before);
});
test('conflicting team identity and unsupported flags fail safely', (t) => {
  const f = fixture(t);
  assert.notEqual(f.run('--force').status, 0);
  f.payload.team.id = 'other';
  f.payload.team.identityId = 'different';
  f.payload.players.forEach(p => { p.teamId = 'other'; });
  f.write(join(f.imports, 'new.json'), f.payload);
  assert.match(f.run().stderr, /conflicting team identity/);
});
