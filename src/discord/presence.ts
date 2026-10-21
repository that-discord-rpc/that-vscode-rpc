/**
 * Translates an `ActivitySnapshot` plus a validated `DiscordConfig` into the
 * payload sent to Discord.
 *
 * Kept pure and free of `discord-rpc` imports so the rendering rules (templates,
 * icon selection, button filtering, length limits) can be unit-tested without a
 * running Discord client.
 */

import { MAX_PRESENCE_TEXT_LENGTH } from '../config/defaults';
import { debuggingIconUrl, idleIconUrl, languageIconUrl, vscodeIconUrl } from './assets';
import {
  FALLBACK_ICON_KEY,
  formatLanguageLabel,
  isDetailedLanguage,
  resolveIconKey,
} from './supportedLanguages';
import type {
  ActivitySnapshot,
  ButtonConfig,
  DiscordConfig,
  ImageConfig,
  RichPresenceButton,
  RichPresencePayload,
} from './types';

/**
 * Builds the Rich Presence payload for a snapshot.
 *
 * @param snapshot The current activity.
 * @param config The validated configuration.
 * @returns The payload, or `undefined` when nothing would be displayed and the
 * presence should be cleared instead.
 */
export function buildPresencePayload(
  snapshot: ActivitySnapshot,
  config: DiscordConfig,
): RichPresencePayload | undefined {
  const payload: RichPresencePayload = {};

  if (config.details.enabled) {
    const text = renderTemplate(config.details.template, snapshot, config);
    if (text) {
      payload.details = text;
    }
  }

  if (config.state.enabled) {
    const text = renderTemplate(config.state.template, snapshot, config);
    if (text) {
      payload.state = text;
    }
  }

  if (config.status.showElapsedTime && snapshot.sessionStart > 0) {
    payload.startTimestamp = snapshot.sessionStart;
  }

  if (config.image.enabled) {
    applyImages(payload, snapshot, config);
  }

  if (config.buttons.enabled) {
    const buttons = buildButtons(config.buttons.primary, config.buttons.secondary);
    if (buttons) {
      payload.buttons = buttons;
    }
  }

  return Object.keys(payload).length > 0 ? payload : undefined;
}

/**
 * Expands `{file}`, `{workspace}`, `{branch}`, and `{language}` in a template,
 * collapsing unresolved placeholders so a disabled field never leaves a
 * dangling word.
 *
 * `{file}` is gated by `details.showFileName` and `{workspace}` by
 * `state.showWorkspaceName`, whichever line the placeholder appears on. That
 * keeps one toggle per value, so hiding file names cannot accidentally leak
 * them through the state line.
 *
 * @param template The user's template string.
 * @param snapshot The activity to interpolate.
 * @param config The validated configuration supplying the visibility toggles.
 * @returns The rendered text, or `undefined` when it is blank.
 */
function renderTemplate(
  template: string,
  snapshot: ActivitySnapshot,
  config: DiscordConfig,
): string | undefined {
  const fileName = config.details.showFileName ? (snapshot.fileName ?? '') : '';
  const workspace = config.state.showWorkspaceName ? (snapshot.workspaceName ?? '') : '';
  const branch = snapshot.gitBranch ?? '';
  const language = snapshot.language
    ? describeLanguage(snapshot, snapshot.languageId ?? '', config.languages.mode)
    : '';

  const result = template
    .replace(/\{file\}/g, fileName)
    .replace(/\{workspace\}/g, workspace)
    .replace(/\{language\}/g, language)
    .replace(/\{branch\}/g, branch)
    .replace(/\{[a-z]+\}/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result.length > 0 ? result.slice(0, MAX_PRESENCE_TEXT_LENGTH) : undefined;
}

/**
 * Chooses the large and small images for the payload.
 *
 * Precedence: debugging, idle, language icon, then the VS Code fallback icon
 * (unless the user turned the fallback off).
 */
function applyImages(
  payload: RichPresencePayload,
  snapshot: ActivitySnapshot,
  config: DiscordConfig,
): void {
  const image: ImageConfig = config.image;
  const fallbackUrl = vscodeIconUrl(image);
  let largeKey: string | undefined;
  let largeText: string | undefined;

  if (snapshot.isDebugging) {
    largeKey = debuggingIconUrl(image);
    largeText = 'Debugging';
  } else if (snapshot.isIdle && config.general.idleTimeoutMinutes > 0) {
    largeKey = idleIconUrl(image);
    largeText = 'Idle';
  } else if (image.useLanguageIcon && snapshot.languageId) {
    const iconKey = resolveIconKey(
      snapshot.languageId,
      config.languages.mode,
      config.languages.enabled,
    );
    if (iconKey !== FALLBACK_ICON_KEY) {
      largeKey = languageIconUrl(iconKey, image);
      largeText = describeLanguage(snapshot, iconKey, config.languages.mode);
    } else if (config.languages.fallbackToVscodeIcon) {
      largeKey = fallbackUrl;
      largeText = 'Visual Studio Code';
    }
  }

  if (largeKey) {
    payload.largeImageKey = largeKey;
    payload.largeImageText = largeText;
  }

  if (image.showVscodeIconAsSmall && largeKey !== fallbackUrl) {
    payload.smallImageKey = fallbackUrl;
    payload.smallImageText = 'Visual Studio Code';
  }
}

/**
 * Returns the hover text for the large language image.
 *
 * Main-mode groups use their registry label ("TypeScript React"); detailed
 * variants use the variant's own label ("SCSS") rather than the parent's.
 */
function describeLanguage(
  snapshot: ActivitySnapshot,
  iconKey: string,
  mode: 'main' | 'detailed',
): string {
  if (mode === 'detailed' && snapshot.languageId === iconKey && isDetailedLanguage(iconKey)) {
    return formatLanguageLabel(iconKey);
  }
  return snapshot.language?.displayName ?? formatLanguageLabel(iconKey);
}

/**
 * Filters the configured buttons down to the ones Discord can render.
 * Discord accepts at most two buttons; callers pass the two configured slots.
 */
function buildButtons(
  primary: ButtonConfig,
  secondary: ButtonConfig,
): RichPresenceButton[] | undefined {
  const buttons: RichPresenceButton[] = [];
  for (const candidate of [primary, secondary]) {
    if (candidate.label.trim().length > 0 && candidate.url.length > 0) {
      buttons.push({ label: candidate.label, url: candidate.url });
    }
  }
  return buttons.length > 0 ? buttons : undefined;
}
