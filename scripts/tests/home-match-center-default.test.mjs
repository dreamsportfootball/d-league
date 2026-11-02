import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultHomeMatchCenterFilter } from '../../utils/homeMatchCenterDefault.mjs';

const preference = (todayKey, finishedDateKeys = ['2026-11-01'], hasUpcoming = true) =>
  getDefaultHomeMatchCenterFilter({ todayKey, finishedDateKeys, hasUpcoming });

test('11/01 matchday and next three Taipei calendar days prioritize latest results', () => {
  for (const day of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']) {
    assert.equal(preference(day), 'Results', day);
  }
});

test('at Taipei midnight on 11/05 return to upcoming fixtures', () => {
  assert.equal(preference('2026-11-05'), 'Upcoming');
});

test('recent finished matches take priority even if the next matchday is today', () => {
  assert.equal(preference('2026-11-08', ['2026-11-01', '2026-11-08']), 'Results');
});

test('three-day window crosses months and years without UTC/local-day drift', () => {
  assert.equal(preference('2026-12-01', ['2026-11-29']), 'Results');
  assert.equal(preference('2026-12-02', ['2026-11-29']), 'Results');
  assert.equal(preference('2026-12-03', ['2026-11-29']), 'Upcoming');
  assert.equal(preference('2027-01-03', ['2026-12-31']), 'Results');
  assert.equal(preference('2027-01-04', ['2026-12-31']), 'Upcoming');
});

test('no completed matches: upcoming is the default', () => {
  assert.equal(preference('2026-11-02', []), 'Upcoming');
});

test('no future fixtures: show the results tab, including after the three-day window', () => {
  assert.equal(preference('2026-11-05', ['2026-11-01'], false), 'Results');
  assert.equal(preference('2026-11-01', [], false), 'Results');
});

test('future-dated results must not activate latest results early', () => {
  assert.equal(preference('2026-10-31'), 'Upcoming');
});

test('invalid date keys do not force the results tab', () => {
  assert.equal(preference('2026-11-06', ['not-a-date']), 'Upcoming');
});
