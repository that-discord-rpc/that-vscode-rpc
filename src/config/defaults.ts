/**
 * Default values for every extension setting.
 *
 * Kept in a standalone module (a) so `settings.ts` can merge user values onto
 * a validated base, (b) so tests can reference canonical defaults without
 * reading VS Code configuration, and (c) so future settings can be added here
 * first, then wired into `package.json` with the same literal.
 */

import type { DiscordConfig } from '../discord/types';

/** The default base URL for icon assets. */
export const DEFAULT_ASSET_BASE_URL =
  'https://raw.githubusercontent.com/that-vscode-rpc/that-vscode-rpc/main/assets';

/**
 * The Discord application ID. Empty by default: Rich Presence only works with
 * an application owned by the person running the extension, so the ID cannot
 * be bundled. `client.ts` turns an empty value into an actionable warning.
 */
export const DEFAULT_DISCORD_CLIENT_ID = '';

/** Discord's maximum length for the `details` and `state` lines. */
export const MAX_PRESENCE_TEXT_LENGTH = 128;

/** Discord's maximum length for a Rich Presence button label. */
export const MAX_BUTTON_LABEL_LENGTH = 32;

/** Discord's maximum length for a Rich Presence button URL. */
export const MAX_BUTTON_URL_LENGTH = 512;

/**
 * Returns `true` when `value` is shaped like a Discord application ID.
 *
 * Discord snowflakes are 17-20 decimal digits. Validating the shape locally
 * turns an opaque IPC login failure into an actionable message.
 */
export function isValidDiscordClientId(value: string): boolean {
  return /^\d{17,20}$/.test(value.trim());
}

/** The fully-populated default configuration. */
export const DEFAULT_CONFIG: DiscordConfig = {
  general: {
    enabled: true,
    clientId: DEFAULT_DISCORD_CLIENT_ID,
    reconnectOnDisconnect: true,
    reconnectAttempts: 5,
    idleTimeoutMinutes: 5,
  },
  languages: {
    mode: 'detailed',
    enabled: [],
    fallbackToVscodeIcon: true,
  },
  details: {
    enabled: true,
    template: 'Editing {file}',
    showFileName: true,
  },
  state: {
    enabled: true,
    template: 'In {workspace}',
    showWorkspaceName: true,
  },
  image: {
    enabled: true,
    useLanguageIcon: true,
    showVscodeIconAsSmall: true,
    baseUrl: DEFAULT_ASSET_BASE_URL,
  },
  status: {
    showElapsedTime: true,
    resetOnFileChange: false,
  },
  ignore: {
    workspaces: [],
    languages: [],
  },
  buttons: {
    enabled: false,
    primary: { label: '', url: '' },
    secondary: { label: '', url: '' },
  },
  misc: {
    debugLogging: false,
  },
  advanced: {
    updateIntervalMs: 1500,
    suppressUntitledFiles: true,
  },
};
