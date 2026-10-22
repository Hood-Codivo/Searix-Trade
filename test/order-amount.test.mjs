import assert from 'node:assert/strict';
import { it } from 'node:test';
import { toQuoteAmount } from '../src/utils/orderAmount.ts';

it('keeps buy amounts in quote-token units, including SOL pairs', () => {
  assert.equal(toQuoteAmount('buy', 250, undefined, 'USDC'), 250);
  assert.equal(toQuoteAmount('buy', 2, 150, 'SOL'), 2);
});

it('converts fractional sell quantities using the live bid', () => {
  assert.equal(toQuoteAmount('sell', 0.1, 150, 'USDC'), 15);
  assert.equal(toQuoteAmount('sell', 2, 0.5, 'SOL'), 1);
});

it('rejects unavailable prices, invalid inputs, and out-of-range quote values', () => {
  for (const bid of [undefined, 0, -1, NaN, Infinity]) {
    assert.throws(() => toQuoteAmount('sell', 1, bid, 'USDC'), /No live sell price/);
  }
  for (const input of [0, -1, NaN, Infinity]) {
    assert.throws(() => toQuoteAmount('buy', input, undefined, 'USDC'));
  }
  assert.throws(() => toQuoteAmount('sell', 0.001, 150, 'USDC'), /1 and 1,000,000 USDC/);
  assert.throws(() => toQuoteAmount('sell', 10_000, 150, 'USDC'));
});
