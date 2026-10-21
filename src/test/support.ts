/**
 * Shared helpers for the test suite: config and snapshot factories.
 *
 * Not a test file (`*.test.ts`), so the suite loader ignores it.
 */

import { DEFAULT_CONFIG } from '../config/defaults';
import type { ActivitySnapshot, DiscordConfig } from '../discord/types';

/**
 * Builds a validated-looking config, merging every provided section over the
 * defaults so tests only state what they care about.
 */
export function makeConfig(overrides: Partial<DiscordConfig> = {}): DiscordConfig {
  return {
    general: { ...DEFAULT_CONFIG.general, ...overrides.general },
    languages: { ...DEFAULT_CONFIG.languages, ...overrides.languages },
    details: { ...DEFAULT_CONFIG.details, ...overrides.details },
    state: { ...DEFAULT_CONFIG.state, ...overrides.state },
    image: { ...DEFAULT_CONFIG.image, ...overrides.image },
    status: { ...DEFAULT_CONFIG.status, ...overrides.status },
    ignore: { ...DEFAULT_CONFIG.ignore, ...overrides.ignore },
    buttons: { ...DEFAULT_CONFIG.buttons, ...overrides.buttons },
    misc: { ...DEFAULT_CONFIG.misc, ...overrides.misc },
    advanced: { ...DEFAULT_CONFIG.advanced, ...overrides.advanced },
  };
}

/** Builds an activity snapshot with sensible, overridable defaults. */
export function makeSnapshot(overrides: Partial<ActivitySnapshot> = {}): ActivitySnapshot {
  return {
    isIdle: false,
    isDebugging: false,
    sessionStart: 1_700_000_000_000,
    lastActivity: 1_700_000_100_000,
    ...overrides,
  };
}
