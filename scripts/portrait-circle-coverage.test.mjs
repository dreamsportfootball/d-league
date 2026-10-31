import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectPortraitCircle } from './portrait-circle-coverage.mjs';
const sample = overrides => inspectPortraitCircle({
  width: 104, height: 104, transform: 'none', overflowX: 'hidden',
  overflowY: 'hidden', borderRadius: '9999px', objectFit: 'cover',
  ...overrides,
});
test('valid centered avatar is fully covered', () => {
  assert.equal(sample({}).passed, true);
});
test('reproduces KA HK over-shift: exposes right circle edge', () => {
  const result = sample({ transform: 'matrix(1.75, 0, 0, 1.75, -41.6, 30.16)' });
  assert.equal(result.passed, false);
  assert.ok(result.uncoveredRatio > 0.05);
});
test('reproduces Chen over-shift: exposes top edge', () => {
  const result = sample({ transform: 'matrix(1.5, 0, 0, 1.5, 0, 31.2)' });
  assert.equal(result.passed, false);
  assert.ok(result.uncoveredRatio > 0.1);
});
test('revised KA HK and Chen placements cover the circle', () => {
  assert.equal(sample({ transform: 'matrix(1.75, 0, 0, 1.75, -36.4, 30.16)' }).passed, true);
  assert.equal(sample({ transform: 'matrix(1.5, 0, 0, 1.5, 0, 20.8)' }).passed, true);
});
test('fails when rounded avatar does not clip transformed pixels', () => {
  assert.equal(sample({ overflowX: 'visible' }).passed, false);
  assert.equal(sample({ borderRadius: '0px' }).passed, false);
});
test('supports nonuniform horizontal stretch without false failure', () => {
  assert.equal(sample({ transform: 'matrix(2.8, 0, 0, 2.1, 0, 0)' }).passed, true);
});
