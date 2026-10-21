/**
 * Typed message contract between the extension and the language picker
 * Webview.
 *
 * All messages flow through `acquireVsCodeApi().postMessage` on the Webview
 * side and `panel.webview.onDidReceiveMessage` on the extension side. Both
 * sides import these types so a change to the shape is caught at compile
 * time in both places.
 */

import type { SupportedLanguage } from '../discord/supportedLanguages';
import { formatLanguageLabel, NO_LANGUAGES_KEY } from '../discord/supportedLanguages';

/**
 * A single row in the rendered tree. Each row carries the icon key, the
 * display label, and whether it is a parent (main language) or child
 * (detailed variant).
 */
export interface PickerRow {
  /** The icon key; both the checkbox identity and the image file name. */
  icon: string;
  /** The label shown next to the checkbox. */
  label: string;
  /** True when this row is a main-language group. */
  isMain: boolean;
  /** True when the user's enabled list includes this icon key. */
  enabled: boolean;
}

/**
 * A group: a main-language row plus its detailed variants.
 * Groups are rendered as one parent row followed by indented children.
 */
export interface PickerGroup {
  main: PickerRow;
  children: PickerRow[];
}

/**
 * Messages sent from the extension to the Webview.
 */
export type ExtensionMessage =
  | {
      type: 'init';
      groups: PickerGroup[];
      mode: 'main' | 'detailed';
      allowAll: boolean;
      iconBaseUrl: string;
    }
  | { type: 'saved'; enabledCount: number; allowAll: boolean };

/**
 * Messages sent from the Webview to the extension.
 */
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'toggle'; icon: string; enabled: boolean }
  | { type: 'setMode'; mode: 'main' | 'detailed' }
  | { type: 'save'; enabled: string[] };

/**
 * Builds the picker group list from the registry and the current enabled
 * set. Rows are sorted alphabetically by icon key.
 *
 * @param languages The full language registry.
 * @param enabled The user's enabled icon keys. Empty means "allow all",
 * but the picker still shows every row as checked so the user can
 * deselect selectively without first ticking everything.
 * @returns The grouped rows.
 */
export function buildPickerGroups(
  languages: readonly SupportedLanguage[],
  enabled: readonly string[],
): PickerGroup[] {
  const allowAll = enabled.length === 0;
  const enabledSet = new Set(enabled.filter((key) => key !== NO_LANGUAGES_KEY));

  const sorted = [...languages].sort((a, b) => a.icon.localeCompare(b.icon));

  return sorted.map((entry) => ({
    main: {
      icon: entry.icon,
      label: entry.displayName,
      isMain: true,
      enabled: allowAll || enabledSet.has(entry.icon),
    },
    children: entry.detailedLanguages.map((detail) => ({
      icon: detail,
      label: formatLanguageLabel(detail),
      isMain: false,
      enabled: allowAll || enabledSet.has(detail),
    })),
  }));
}

/**
 * Runtime validator for messages arriving from the Webview. The contract is
 * typed, but Webview messages are still untrusted input at runtime.
 *
 * @param value The raw message payload.
 * @returns `true` when the payload matches {@link WebviewMessage}.
 */
export function isWebviewMessage(value: unknown): value is WebviewMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const message = value as Record<string, unknown>;
  switch (message.type) {
    case 'ready':
      return true;
    case 'toggle':
      return typeof message.icon === 'string' && typeof message.enabled === 'boolean';
    case 'setMode':
      return message.mode === 'main' || message.mode === 'detailed';
    case 'save':
      return (
        Array.isArray(message.enabled) &&
        message.enabled.every((entry): entry is string => typeof entry === 'string')
      );
    default:
      return false;
  }
}
