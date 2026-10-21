/**
 * Shared type definitions forming the seam between the VS Code world and the
 * Discord world. No runtime code lives here — only types and interfaces.
 *
 * Both `vscode/` and `discord/` import from this file, which keeps the
 * dependency graph acyclic: neither world depends on the other.
 */

import type { SupportedLanguage } from './supportedLanguages';

/**
 * A snapshot of what Rich Presence should display at a given moment.
 * Produced by the VS Code world, consumed by the Discord world.
 */
export interface ActivitySnapshot {
  /** The file name (basename only), or `undefined` when no file is active. */
  fileName?: string;
  /** The VS Code language ID of the active file. */
  languageId?: string;
  /** The workspace folder name, or `undefined` when no folder is open. */
  workspaceName?: string;
  /** The current git branch (or short SHA), when the workspace is a repository. */
  gitBranch?: string;
  /** Resolved language group for the active file, if any. */
  language?: SupportedLanguage;
  /** True when the user has been idle for longer than the configured timeout. */
  isIdle: boolean;
  /** True when a debug session is active. */
  isDebugging: boolean;
  /** Epoch milliseconds when the current session started. */
  sessionStart: number;
  /** Epoch milliseconds of the last observed activity. */
  lastActivity: number;
}

/**
 * Fully validated configuration, produced by `config/settings.ts` from the
 * raw VS Code configuration object. Everything here has been clamped,
 * defaulted, and typed.
 */
export interface DiscordConfig {
  general: GeneralConfig;
  languages: LanguagesConfig;
  details: DetailsConfig;
  state: StateConfig;
  image: ImageConfig;
  status: StatusConfig;
  ignore: IgnoreConfig;
  buttons: ButtonsConfig;
  misc: MiscConfig;
  advanced: AdvancedConfig;
}

/** General connection and lifecycle settings. */
export interface GeneralConfig {
  enabled: boolean;
  clientId: string;
  reconnectOnDisconnect: boolean;
  reconnectAttempts: number;
  idleTimeoutMinutes: number;
}

/** Language resolution and filtering settings. */
export interface LanguagesConfig {
  mode: 'main' | 'detailed';
  enabled: string[];
  fallbackToVscodeIcon: boolean;
}

/** Details line settings. */
export interface DetailsConfig {
  enabled: boolean;
  template: string;
  showFileName: boolean;
}

/** State line settings. */
export interface StateConfig {
  enabled: boolean;
  template: string;
  showWorkspaceName: boolean;
}

/** Image settings. */
export interface ImageConfig {
  enabled: boolean;
  useLanguageIcon: boolean;
  showVscodeIconAsSmall: boolean;
  baseUrl: string;
}

/** Elapsed-time and status line settings. */
export interface StatusConfig {
  showElapsedTime: boolean;
  resetOnFileChange: boolean;
}

/** Ignore lists. */
export interface IgnoreConfig {
  workspaces: string[];
  languages: string[];
}

/** A single button configuration. */
export interface ButtonConfig {
  label: string;
  url: string;
}

/** Buttons settings. */
export interface ButtonsConfig {
  enabled: boolean;
  primary: ButtonConfig;
  secondary: ButtonConfig;
}

/** Miscellaneous behavior settings. */
export interface MiscConfig {
  debugLogging: boolean;
}

/** Advanced tuning settings. */
export interface AdvancedConfig {
  updateIntervalMs: number;
  suppressUntitledFiles: boolean;
}

/**
 * The connection lifecycle state of the Discord RPC client.
 * - `disconnected`: no connection has been established.
 * - `connecting`: `login()` has been called, `ready` has not fired.
 * - `connected`: the client is ready to send activity updates.
 * - `reconnecting`: a previous connection was lost, retry in progress.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * A single button in the Rich Presence payload.
 * Discord accepts at most two.
 */
export interface RichPresenceButton {
  label: string;
  url: string;
}

/**
 * The payload sent to Discord via `setActivity`. Mirrors the subset of
 * `discord-rpc`'s `SetActivity` we actually use, so we can swap the library
 * without touching callers.
 */
export interface RichPresencePayload {
  details?: string;
  state?: string;
  startTimestamp?: number | Date;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: RichPresenceButton[];
  instance?: boolean;
}

/**
 * Events emitted by the Discord client for observers to subscribe to.
 * Kept as a typed union so `client.on(...)` handlers are exhaustive.
 */
export type ClientEvent =
  | { type: 'connected' }
  | { type: 'disconnected'; reason: string }
  | { type: 'reconnecting'; attempt: number; maxAttempts: number }
  | { type: 'error'; error: Error };
