import test from 'node:test';
import assert from 'node:assert/strict';
import { alignSeries, comparison, percentChange, volatility } from '../core.js';

test('alignSeries keeps only common candle timestamps', () => {
  const aligned = alignSeries(
    [{ timestamp: '2026-08-20T00:00:00Z', close: 100 }, { timestamp: '2026-08-21T00:00:00Z', close: 110 }],
    [{ timestamp: '2026-08-19T00:00:00Z', close: 50 }, { timestamp: '2026-08-21T00:00:00Z', close: 55 }]
  );
  assert.equal(aligned.pointsA.length, 1);
  assert.equal(aligned.pointsA[0].close, 110);
  assert.equal(aligned.pointsB[0].close, 55);
});

test('percentage change and volatility handle common cases', () => {
  assert.equal(percentChange([100, 110]), 10);
  assert.equal(percentChange([]), 0);
  assert.equal(volatility([100]), 0);
  assert.ok(volatility([100, 101, 99, 104]) > 0);
});

test('comparison normalizes aligned closing prices and returns the spread', () => {
  const a = [{ timestamp: '2026-08-20T00:00:00Z', close: 100 }, { timestamp: '2026-08-21T00:00:00Z', close: 110 }];
  const b = [{ timestamp: '2026-08-20T00:00:00Z', close: 50 }, { timestamp: '2026-08-21T00:00:00Z', close: 55 }];
  const result = comparison(a, b);
  assert.deepEqual(result.seriesA, [100, 110]);
  assert.deepEqual(result.seriesB, [100, 110]);
  assert.equal(result.spread, result.returnA - result.returnB);
});
