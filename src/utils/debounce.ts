/**
 * Generic debounce and throttle helpers.
 *
 * Debounce: delay the call until the input stops for a given window.
 * Throttle: invoke at most once per window, dropping calls in between.
 *
 * Both return a cancellable function. Kept pure (no VS Code imports) so they
 * can be unit-tested without booting the extension host.
 */

/**
 * Creates a debounced wrapper around `fn`. The wrapper postpones invocation
 * until `waitMs` has elapsed since the last call.
 *
 * @param fn The function to debounce.
 * @param waitMs The quiet window in milliseconds.
 * @returns A debounced function with a `.cancel()` method.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
  };

  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}

/**
 * Creates a throttled wrapper around `fn`. The wrapper invokes at most once
 * per `waitMs`, using the last call's arguments.
 *
 * @param fn The function to throttle.
 * @param waitMs The minimum gap between invocations, in milliseconds.
 * @returns A throttled function with a `.cancel()` method.
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let lastCall = 0;
  let pendingArgs: Args | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const invoke = (): void => {
    timer = undefined;
    if (pendingArgs) {
      lastCall = Date.now();
      const args = pendingArgs;
      pendingArgs = undefined;
      fn(...args);
    }
  };

  const throttled = (...args: Args): void => {
    const now = Date.now();
    const remaining = waitMs - (now - lastCall);
    pendingArgs = args;

    if (remaining <= 0) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      invoke();
      return;
    }

    if (timer === undefined) {
      timer = setTimeout(invoke, remaining);
    }
  };

  throttled.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    pendingArgs = undefined;
  };

  return throttled;
}
