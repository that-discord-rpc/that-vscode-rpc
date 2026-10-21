/**
 * Budget tests for `SlidingWindowLimiter`.
 *
 * Pure: a fake clock advances time, so no timers or sleeping.
 */

import * as assert from 'node:assert/strict';

import { SlidingWindowLimiter } from '../../discord/rateLimiter';

interface LimiterFixture {
  limiter: SlidingWindowLimiter;
  advance: (ms: number) => void;
}

function createLimiter(limit = 5, windowMs = 20_000): LimiterFixture {
  let now = 1_000;
  const limiter = new SlidingWindowLimiter(limit, windowMs, () => now);
  return {
    limiter,
    advance: (ms: number): void => {
      now += ms;
    },
  };
}

suite('rateLimiter — sliding window', () => {
  test('allows exactly the configured number of calls', () => {
    const { limiter } = createLimiter();

    for (let i = 0; i < 5; i++) {
      assert.equal(limiter.tryAcquire(), 0, `call ${i + 1} should be allowed`);
    }
  });

  test('rejects the next call and reports when a slot frees up', () => {
    const { limiter } = createLimiter();

    for (let i = 0; i < 5; i++) {
      limiter.tryAcquire();
    }

    assert.equal(limiter.tryAcquire(), 20_000);
  });

  test('accounts for time already elapsed in the window', () => {
    const { limiter, advance } = createLimiter();

    for (let i = 0; i < 5; i++) {
      limiter.tryAcquire();
    }
    advance(15_000);

    assert.equal(limiter.tryAcquire(), 5_000);
  });

  test('accepts calls again one at a time as timestamps leave the window', () => {
    const { limiter, advance } = createLimiter();

    // Five calls, one second apart: timestamps 1s…5s after the start.
    for (let i = 0; i < 5; i++) {
      limiter.tryAcquire();
      advance(1_000);
    }

    // The oldest call expires 15s from now.
    advance(14_000);
    assert.equal(limiter.tryAcquire(), 1_000);

    advance(1_000);
    assert.equal(limiter.tryAcquire(), 0, 'the oldest slot should have freed up');
    assert.equal(limiter.tryAcquire(), 1_000, 'only one slot should have freed up');
  });

  test('reset empties the window', () => {
    const { limiter } = createLimiter(1);

    limiter.tryAcquire();
    assert.equal(limiter.tryAcquire(), 20_000);

    limiter.reset();
    assert.equal(limiter.tryAcquire(), 0);
  });

  test('rejects unusable limits', () => {
    assert.throws(() => new SlidingWindowLimiter(0, 20_000), RangeError);
    assert.throws(() => new SlidingWindowLimiter(5, 0), RangeError);
  });
});
