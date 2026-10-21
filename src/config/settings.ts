/**
 * Reads, validates, and watches the extension's VS Code configuration.
 *
 * This is the only module permitted to call `workspace.getConfiguration`.
 * Every other module receives a fully-typed, clamped `DiscordConfig` and
 * subscribes to change notifications through `ConfigWatcher`.
 *
 * Raw values from the configuration UI are untrusted: users can hand-edit
 * `settings.json`, sync invalid values from other machines, or run an older
 * version of the manifest. Every field is therefore re-validated here, with
 * defaults applied before validation.
 */

import * as vscode from 'vscode';

import {
  DEFAULT_CONFIG,
  MAX_BUTTON_LABEL_LENGTH,
  MAX_BUTTON_URL_LENGTH,
  MAX_PRESENCE_TEXT_LENGTH,
} from './defaults';
import type {
  AdvancedConfig,
  ButtonConfig,
  ButtonsConfig,
  DetailsConfig,
  DiscordConfig,
  GeneralConfig,
  IgnoreConfig,
  ImageConfig,
  LanguagesConfig,
  MiscConfig,
  StateConfig,
  StatusConfig,
} from '../discord/types';
import { isPermissionKey, NO_LANGUAGES_KEY } from '../discord/supportedLanguages';
import { getLogger } from '../utils/logger';

const CONFIG_ROOT = 'thatVscodeRpc';

/**
 * Reads the current configuration, applying defaults and validation, and
 * returns a fully-typed `DiscordConfig`.
 *
 * @returns A validated configuration object.
 */
export function readConfig(): DiscordConfig {
  const cfg = vscode.workspace.getConfiguration(CONFIG_ROOT);

  return {
    general: readGeneral(cfg),
    languages: readLanguages(cfg),
    details: readDetails(cfg),
    state: readState(cfg),
    image: readImage(cfg),
    status: readStatus(cfg),
    ignore: readIgnore(cfg),
    buttons: readButtons(cfg),
    misc: readMisc(cfg),
    advanced: readAdvanced(cfg),
  };
}

/**
 * Observes configuration changes and invokes a callback with the newly
 * validated configuration whenever any `thatVscodeRpc.*` setting changes.
 *
 * The watcher ignores changes made to unrelated settings. Rapid changes
 * (e.g. dragging a slider) are collapsed by the caller, not here — this
 * watcher forwards each event as it arrives.
 */
export class ConfigWatcher implements vscode.Disposable {
  private readonly listener: vscode.Disposable;
  private readonly callback: (config: DiscordConfig) => void;

  /**
   * @param callback Invoked with the validated config on each change.
   */
  constructor(callback: (config: DiscordConfig) => void) {
    this.callback = callback;
    this.listener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(CONFIG_ROOT)) {
        return;
      }
      try {
        this.callback(readConfig());
      } catch (err) {
        getLogger().error('ConfigWatcher callback failed', err);
      }
    });
  }

  /** Stops observing configuration changes. */
  dispose(): void {
    this.listener.dispose();
  }
}

function readGeneral(cfg: vscode.WorkspaceConfiguration): GeneralConfig {
  const d = DEFAULT_CONFIG.general;
  return {
    enabled: asBoolean(cfg.get('general.enabled'), d.enabled),
    clientId: asNonEmptyString(cfg.get('general.clientId'), d.clientId).trim(),
    reconnectOnDisconnect: asBoolean(
      cfg.get('general.reconnectOnDisconnect'),
      d.reconnectOnDisconnect,
    ),
    reconnectAttempts: asInt(cfg.get('general.reconnectAttempts'), d.reconnectAttempts, 0),
    idleTimeoutMinutes: asInt(cfg.get('general.idleTimeoutMinutes'), d.idleTimeoutMinutes, 0),
  };
}

function readLanguages(cfg: vscode.WorkspaceConfiguration): LanguagesConfig {
  const d = DEFAULT_CONFIG.languages;
  const mode = cfg.get<'main' | 'detailed'>('languages.mode', d.mode);
  // The picker stores detailed variants (e.g. `scss`) as well as icon keys, so
  // filter against every key the picker can produce rather than icons alone.
  // The "nothing enabled" sentinel is preserved as the sole entry.
  const rawEnabled = asStringArray(cfg.get('languages.enabled'), d.enabled);
  const enabled = rawEnabled.includes(NO_LANGUAGES_KEY)
    ? [NO_LANGUAGES_KEY]
    : rawEnabled.filter((key) => isPermissionKey(key));
  return {
    mode: mode === 'main' || mode === 'detailed' ? mode : d.mode,
    enabled,
    fallbackToVscodeIcon: asBoolean(
      cfg.get('languages.fallbackToVscodeIcon'),
      d.fallbackToVscodeIcon,
    ),
  };
}

function readDetails(cfg: vscode.WorkspaceConfiguration): DetailsConfig {
  const d = DEFAULT_CONFIG.details;
  return {
    enabled: asBoolean(cfg.get('details.enabled'), d.enabled),
    template: asPresenceText(cfg.get('details.template'), d.template),
    showFileName: asBoolean(cfg.get('details.showFileName'), d.showFileName),
  };
}

function readState(cfg: vscode.WorkspaceConfiguration): StateConfig {
  const d = DEFAULT_CONFIG.state;
  return {
    enabled: asBoolean(cfg.get('state.enabled'), d.enabled),
    template: asPresenceText(cfg.get('state.template'), d.template),
    showWorkspaceName: asBoolean(cfg.get('state.showWorkspaceName'), d.showWorkspaceName),
  };
}

function readImage(cfg: vscode.WorkspaceConfiguration): ImageConfig {
  const d = DEFAULT_CONFIG.image;
  return {
    enabled: asBoolean(cfg.get('image.enabled'), d.enabled),
    useLanguageIcon: asBoolean(cfg.get('image.useLanguageIcon'), d.useLanguageIcon),
    showVscodeIconAsSmall: asBoolean(
      cfg.get('image.showVscodeIconAsSmall'),
      d.showVscodeIconAsSmall,
    ),
    baseUrl: asAssetBaseUrl(cfg.get('image.baseUrl'), d.baseUrl),
  };
}

function readStatus(cfg: vscode.WorkspaceConfiguration): StatusConfig {
  const d = DEFAULT_CONFIG.status;
  return {
    showElapsedTime: asBoolean(cfg.get('status.showElapsedTime'), d.showElapsedTime),
    resetOnFileChange: asBoolean(cfg.get('status.resetOnFileChange'), d.resetOnFileChange),
  };
}

function readIgnore(cfg: vscode.WorkspaceConfiguration): IgnoreConfig {
  const d = DEFAULT_CONFIG.ignore;
  return {
    workspaces: asStringArray(cfg.get('ignore.workspaces'), d.workspaces),
    languages: asStringArray(cfg.get('ignore.languages'), d.languages),
  };
}

function readButtons(cfg: vscode.WorkspaceConfiguration): ButtonsConfig {
  const d = DEFAULT_CONFIG.buttons;
  return {
    enabled: asBoolean(cfg.get('buttons.enabled'), d.enabled),
    primary: asButton(cfg.get('buttons.primary'), d.primary),
    secondary: asButton(cfg.get('buttons.secondary'), d.secondary),
  };
}

function readMisc(cfg: vscode.WorkspaceConfiguration): MiscConfig {
  const d = DEFAULT_CONFIG.misc;
  return {
    debugLogging: asBoolean(cfg.get('misc.debugLogging'), d.debugLogging),
  };
}

function readAdvanced(cfg: vscode.WorkspaceConfiguration): AdvancedConfig {
  const d = DEFAULT_CONFIG.advanced;
  return {
    // Clamped to the manifest minimum so hand-edited settings cannot push
    // updates faster than Discord's rate limit can absorb.
    updateIntervalMs: asInt(cfg.get('advanced.updateIntervalMs'), d.updateIntervalMs, 500),
    suppressUntitledFiles: asBoolean(
      cfg.get('advanced.suppressUntitledFiles'),
      d.suppressUntitledFiles,
    ),
  };
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * Validates an icon base URL. Discord fetches these images itself, so only
 * absolute HTTPS URLs work; anything else silently produces broken images.
 */
function asAssetBaseUrl(value: unknown, fallback: string): string {
  const raw = asString(value, fallback).trim().replace(/\/+$/, '');
  return /^https:\/\/\S+$/i.test(raw) ? raw : fallback;
}

function asInt(value: unknown, fallback: number, min: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.floor(value));
}

/**
 * Normalizes a Rich Presence text template. Discord rejects lines longer than
 * 128 characters, so over-long templates are truncated rather than dropped.
 */
function asPresenceText(value: unknown, fallback: string): string {
  const text = asString(value, fallback);
  return text.length > MAX_PRESENCE_TEXT_LENGTH ? text.slice(0, MAX_PRESENCE_TEXT_LENGTH) : text;
}

function asStringArray(value: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function asButton(value: unknown, fallback: ButtonConfig): ButtonConfig {
  if (typeof value !== 'object' || value === null) {
    return { ...fallback };
  }
  const obj = value as Record<string, unknown>;
  return {
    label: asString(obj.label, fallback.label).slice(0, MAX_BUTTON_LABEL_LENGTH),
    url: normalizeButtonUrl(asString(obj.url, fallback.url)),
  };
}

/**
 * Drops anything Discord cannot render as a button: only absolute HTTP(S)
 * URLs are accepted, and URLs longer than Discord's limit are discarded.
 */
function normalizeButtonUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_BUTTON_URL_LENGTH) {
    return '';
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}
