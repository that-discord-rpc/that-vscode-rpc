/**
 * Builds Discord Rich Presence image references from icon keys.
 *
 * Discord accepts either an uploaded asset key or an absolute URL for image
 * fields. This extension uses URLs pointing at the extension's GitHub raw
 * content, so no Developer Portal uploads are required and animated formats
 * remain available. See the Discord Social SDK docs for the URL alternative
 * to uploaded assets.
 *
 * Every URL produced here resolves to a file under `assets/` in the
 * extension's repository. The base URL is user-configurable, so a fork or
 * self-host can point at its own hosting without code changes.
 */

import type { ImageConfig } from './types';

const LANGUAGE_DIR = 'languages';
const STATE_DIR = 'states';

/**
 * Returns the URL for a language icon.
 *
 * @param iconKey The registry icon key (e.g. `typescript`, `css`).
 * @param config The image configuration providing `baseUrl`.
 * @returns An absolute URL to the icon file.
 */
export function languageIconUrl(iconKey: string, config: ImageConfig): string {
  return joinUrl(config.baseUrl, LANGUAGE_DIR, `${iconKey}.png`);
}

/**
 * Returns the URL for the VS Code state icon.
 *
 * Used as the small image when `showVscodeIconAsSmall` is enabled, and as
 * the large image fallback when no language icon applies.
 *
 * @param config The image configuration providing `baseUrl`.
 * @returns An absolute URL to the VS Code icon.
 */
export function vscodeIconUrl(config: ImageConfig): string {
  return joinUrl(config.baseUrl, STATE_DIR, 'vscode.png');
}

/**
 * Returns the URL for the debugging state icon.
 *
 * @param config The image configuration providing `baseUrl`.
 * @returns An absolute URL to the debugging icon.
 */
export function debuggingIconUrl(config: ImageConfig): string {
  return joinUrl(config.baseUrl, STATE_DIR, 'debugging.png');
}

/**
 * Returns the URL for the idle state icon.
 *
 * @param config The image configuration providing `baseUrl`.
 * @returns An absolute URL to the idle icon.
 */
export function idleIconUrl(config: ImageConfig): string {
  return joinUrl(config.baseUrl, STATE_DIR, 'idle.png');
}

function joinUrl(base: string, ...segments: string[]): string {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}/${segments.join('/')}`;
}
