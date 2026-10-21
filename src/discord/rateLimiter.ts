/**
 * Sliding-window rate limiter for Discord presence updates.
 *
 * Discord allows five `SET_ACTIVITY` calls per twenty seconds. A user who
 * switches files quickly can exceed that, so the client asks this limiter
 * before every send. The limiter is pure and clock-injectable so the budget
 * logic can be unit-tested without waiting twenty real seconds.
 *
 * The limiter only reports when the next call is allowed; deciding what to do
 * with a rejected call (coalescing, delaying) belongs to the caller.
 */
export class SlidingWindowLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  /** Timestamps of accepted calls, oldest first. */
  private accepted: number[] = [];

  /**
   * @param limit Maximum calls allowed inside the window.
   * @param windowMs Length of the sliding window in milliseconds.
   * @param now Clock used for timestamps; injectable for tests.
   */
  constructor(limit: number, windowMs: number, now: () => number = Date.now) {
    if (limit < 1) {
      throw new RangeError('limit must be at least 1');
    }
    if (windowMs < 1) {
      throw new RangeError('windowMs must be at least 1');
    }
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
  }

  /**
   * Attempts to reserve one call.
   *
   * @returns `0` when the call may proceed now, otherwise the number of
   * milliseconds until the oldest accepted call leaves the window.
   */
  tryAcquire(): number {
    const now = this.now();
    this.accepted = this.accepted.filter((timestamp) => now - timestamp < this.windowMs);

    if (this.accepted.length < this.limit) {
      this.accepted.push(now);
      return 0;
    }

    return Math.max(1, this.windowMs - (now - this.accepted[0]));
  }

  /** Clears the window. Used when the connection is recreated. */
  reset(): void {
    this.accepted = [];
  }
}
