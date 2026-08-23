import test from 'node:test';
import assert from 'node:assert/strict';
import { comparison, makeSeries, percentChange, volatility } from '../core.js';

test('series generation is deterministic and normalized to 100', () => {
  const first = makeSeries('SPY', '1M');
  assert.deepEqual(first, makeSeries('SPY', '1M'));
  assert.equal(first.length, 42);
  assert.ok(first[0] > 95 && first[0] < 105);
});

test('percentage change and volatility handle common cases', () => {
  assert.equal(percentChange([100, 110]), 10);
  assert.equal(percentChange([]), 0);
  assert.equal(volatility([100]), 0);
  assert.ok(volatility([100, 101, 99, 104]) > 0);
});

test('comparison returns aligned values and its spread', () => {
  const result = comparison({ symbol: 'SPY' }, { symbol: 'QQQ' }, '1W');
  assert.equal(result.seriesA.length, result.seriesB.length);
  assert.equal(result.spread, result.returnA - result.returnB);
});
