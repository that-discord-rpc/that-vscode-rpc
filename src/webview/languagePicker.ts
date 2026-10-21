/**
 * Manages the language picker Webview panel.
 *
 * The panel renders the full language registry as a tree of checkboxes,
 * writes every toggle immediately to `thatVscodeRpc.languages.enabled`,
 * and reflects external changes (from settings.json edits, sync, etc.)
 * back into the UI.
 *
 * The panel is a singleton: `show()` reveals an existing panel rather than
 * creating a second one. The Webview module is loaded lazily from
 * `extension.ts` so its bundle is never paid for unless the picker is opened.
 */

import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import * as vscode from 'vscode';

import {
  SUPPORTED_LANGUAGES,
  getAllPermissionKeys,
  isPermissionKey,
  NO_LANGUAGES_KEY,
} from '../discord/supportedLanguages';
import { readConfig } from '../config/settings';
import { getLogger } from '../utils/logger';
import { buildPickerGroups, isWebviewMessage, type ExtensionMessage } from './messages';

const CONFIG_ROOT = 'thatVscodeRpc';
const ENABLED_KEY = 'languages.enabled';
const MODE_KEY = 'languages.mode';

/** Window during which a locally written setting is not echoed back to the UI. */
const LOCAL_WRITE_SUPPRESSION_MS = 500;

const TEMPLATE_SEGMENTS = ['dist', 'webview', 'languagePicker.html'];

/**
 * Singleton controller for the language picker panel.
 */
export class LanguagePickerPanel {
  private static current: LanguagePickerPanel | undefined;
  /** In-flight panel creation, so two rapid invocations share one panel. */
  private static opening: Promise<void> | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly disposables: vscode.Disposable[] = [];
  private suppressRefreshUntil = 0;
  private disposed = false;

  /**
   * Reveals an existing panel, or creates a new one.
   *
   * @param context The extension context used to resolve the Webview assets
   * and register disposables.
   */
  static async show(context: vscode.ExtensionContext): Promise<void> {
    const existing = LanguagePickerPanel.current;
    if (existing && !existing.disposed) {
      existing.panel.reveal();
      await existing.refresh();
      return;
    }

    if (!LanguagePickerPanel.opening) {
      LanguagePickerPanel.opening = (async (): Promise<void> => {
        const template = await readTemplate(context.extensionUri);
        if (LanguagePickerPanel.current) {
          LanguagePickerPanel.current.panel.reveal();
        } else {
          LanguagePickerPanel.current = new LanguagePickerPanel(context, template);
        }
      })().finally((): void => {
        LanguagePickerPanel.opening = undefined;
      });
    }

    await LanguagePickerPanel.opening;
  }

  private constructor(context: vscode.ExtensionContext, template: string) {
    this.extensionUri = context.extensionUri;

    const webviewRoot = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview');
    this.panel = vscode.window.createWebviewPanel(
      'thatVscodeRpc.languagePicker',
      'Language Picker — That VSCode RPC',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [webviewRoot],
      },
    );

    const iconUri = vscode.Uri.joinPath(context.extensionUri, 'assets', 'logos', 'icon.png');
    this.panel.iconPath = iconUri;

    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((message: unknown) => {
        void this.handleMessage(message).catch((err: unknown) => {
          getLogger().error('Language picker message failed', err);
        });
      }),
      this.panel.onDidDispose(() => this.dispose()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (Date.now() < this.suppressRefreshUntil) {
          return;
        }
        if (event.affectsConfiguration(`${CONFIG_ROOT}.${ENABLED_KEY}`)) {
          void this.refresh();
        }
      }),
    );

    // Set the document only after the message listener exists: the Webview
    // posts `ready` as soon as its script runs, and a missed message would
    // leave the panel empty.

    this.panel.webview.html = this.renderHtml(template);

    context.subscriptions.push(this.panel);
  }

  private async handleMessage(raw: unknown): Promise<void> {
    if (!isWebviewMessage(raw)) {
      getLogger().warn('Ignoring malformed Webview message');
      return;
    }

    switch (raw.type) {
      case 'ready':
        await this.refresh();
        break;
      case 'toggle':
        await this.toggle(raw.icon, raw.enabled);
        break;
      case 'setMode':
        await this.updateSetting(MODE_KEY, raw.mode);
        break;
      case 'save':
        await this.save(raw.enabled);
        break;
    }
  }

  private async toggle(icon: string, enabled: boolean): Promise<void> {
    if (!isPermissionKey(icon)) {
      getLogger().warn(`Ignoring toggle for unknown icon key "${icon}"`);
      return;
    }

    const configuration = vscode.workspace.getConfiguration(CONFIG_ROOT);
    const raw = configuration.get<string[]>(ENABLED_KEY, []);
    const allowAll = raw.length === 0;
    const current = raw.filter((key) => isPermissionKey(key));

    // An empty array means "show everything"; materialize it before removing
    // one entry so the user's opt-out is actually persisted.
    const effective = allowAll ? getAllPermissionKeys() : current;
    const next = enabled
      ? Array.from(new Set([...effective, icon]))
      : effective.filter((key) => key !== icon);

    // Hiding the last language must not fall back to "allow everything", so
    // store an explicit sentinel instead of an empty array.
    const stored = next.length === 0 ? [NO_LANGUAGES_KEY] : next;
    await this.writeEnabled(stored);
    await this.postSaved(stored);
  }

  private async save(enabled: string[]): Promise<void> {
    const next = enabled.includes(NO_LANGUAGES_KEY)
      ? [NO_LANGUAGES_KEY]
      : Array.from(new Set(enabled.filter((key) => isPermissionKey(key))));
    await this.writeEnabled(next);
    // Bulk changes replace the selection wholesale, so re-render from config.
    await this.refresh();
  }

  private async writeEnabled(enabled: string[]): Promise<void> {
    this.suppressRefreshUntil = Date.now() + LOCAL_WRITE_SUPPRESSION_MS;
    await vscode.workspace
      .getConfiguration(CONFIG_ROOT)
      .update(ENABLED_KEY, enabled, vscode.ConfigurationTarget.Global);
  }

  private async updateSetting(key: string, value: unknown): Promise<void> {
    this.suppressRefreshUntil = Date.now() + LOCAL_WRITE_SUPPRESSION_MS;
    await vscode.workspace
      .getConfiguration(CONFIG_ROOT)
      .update(key, value, vscode.ConfigurationTarget.Global);
  }

  private async postSaved(enabled: string[]): Promise<void> {
    const message: ExtensionMessage = {
      type: 'saved',
      enabledCount: enabled.length,
      allowAll: enabled.length === 0,
    };
    await this.panel.webview.postMessage(message);
  }

  private async refresh(): Promise<void> {
    if (this.disposed) {
      return;
    }
    const config = readConfig();
    const message: ExtensionMessage = {
      type: 'init',
      groups: buildPickerGroups(SUPPORTED_LANGUAGES, config.languages.enabled),
      mode: config.languages.mode,
      allowAll: config.languages.enabled.length === 0,
      iconBaseUrl: config.image.baseUrl,
    };
    await this.panel.webview.postMessage(message);
  }

  /**
   * Injects the CSP, resource URIs, and nonce into the built HTML template.
   * The template itself contains no dynamic values.
   */
  private renderHtml(template: string): string {
    const webview = this.panel.webview;
    const scriptUri = webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'languagePicker.js'))
      .toString();
    const styleUri = webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'languagePicker.css'))
      .toString();
    const nonce = randomBytes(16).toString('base64');

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource}`,
      `font-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return template
      .replace(/\{\{csp\}\}/g, escapeAttribute(csp))
      .replace(/\{\{styleUri\}\}/g, escapeAttribute(styleUri))
      .replace(/\{\{scriptUri\}\}/g, escapeAttribute(scriptUri))
      .replace(/\{\{nonce\}\}/g, nonce);
  }

  private dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    LanguagePickerPanel.current = undefined;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}

/** Escapes a value for safe interpolation into an HTML attribute. */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Reads the built Webview template, with an actionable error if it is absent. */
async function readTemplate(extensionUri: vscode.Uri): Promise<string> {
  const uri = vscode.Uri.joinPath(extensionUri, ...TEMPLATE_SEGMENTS);
  try {
    return await readFile(uri.fsPath, 'utf8');
  } catch (err) {
    getLogger().error('Language picker template missing', err);
    throw new Error(
      `The language picker template is missing (${uri.fsPath}). Run "npm run build" and reload the window.`,
    );
  }
}
