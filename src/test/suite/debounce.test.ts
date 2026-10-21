/**
 * Timing behavior tests for `debounce` and `throttle`.
 *
 * Runs in plain Node. Uses short timeouts (a few milliseconds) so the suite
 * stays fast; assertions are on call counts, not wall-clock precision.
 */

import * as assert from 'node:assert/strict';

import { debounce, throttle } from '../../utils/debounce';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

suite('debounce', () => {
  test('collapses rapid calls into one', async () => {
    let calls = 0;
    const fn = debounce(() => calls++, 20);
    fn();
    fn();
    fn();
    await delay(40);
    assert.equal(calls, 1);
  });

  test('uses the last arguments', async () => {
    let last = '';
    const fn = debounce((value: string) => {
      last = value;
    }, 20);
    fn('a');
    fn('b');
    fn('c');
    await delay(40);
    assert.equal(last, 'c');
  });

  test('cancel prevents the pending call', async () => {
    let calls = 0;
    const fn = debounce(() => calls++, 20);
    fn();
    fn.cancel();
    await delay(40);
    assert.equal(calls, 0);
  });
});

suite('throttle', () => {
  test('invokes immediately on the first call', () => {
    let calls = 0;
    const fn = throttle(() => calls++, 30);
    fn();
    assert.equal(calls, 1);
  });

  test('drops calls within the window and invokes the last one trailing', async () => {
    let calls = 0;
    const fn = throttle(() => calls++, 30);
    fn();
    fn();
    fn();
    await delay(50);
    assert.equal(calls, 2);
  });

  test('cancel prevents the trailing invocation', async () => {
    let calls = 0;
    const fn = throttle(() => calls++, 30);
    fn();
    fn();
    fn.cancel();
    await delay(50);
    assert.equal(calls, 1);
  });
});
