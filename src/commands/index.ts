/**
 * Registers the extension's commands with VS Code.
 *
 * Commands are the only entry points through which the user acts on the
 * extension. Each handler is deliberately thin: it reads config, updates
 * config, or calls a method on an injected dependency. Business logic lives
 * in the dependency, not here.
 */

import * as vscode from 'vscode';

import type { DiscordClient } from '../discord/client';
import type { ActivityWatcher } from '../vscode/activity';
import { readConfig } from '../config/settings';
import { SUPPORTED_LANGUAGES } from '../discord/supportedLanguages';
import { getLogger } from '../utils/logger';

const CONFIG_ROOT = 'thatVscodeRpc';

/**
 * Dependencies required to register the extension's commands.
 *
 * The client and watcher are read through getters because the reconnect
 * command replaces the client instance; commands must always act on the
 * instance that is currently wired.
 */
export interface CommandDependencies {
  /** Returns the current Discord client, if one has been created. */
  getClient: () => DiscordClient | undefined;
  /** Returns the activity watcher, used to re-emit after a config change. */
  getWatcher: () => ActivityWatcher | undefined;
  /** Reveals the extension's output channel. */
  showLogger: () => void;
  /** Opens the Webview language picker. */
  openLanguagePicker: () => Promise<void>;
  /** Disposes the current client and connects a fresh one. */
  reconnect: () => Promise<void>;
}

/**
 * Registers every extension command with VS Code and pushes their
 * disposables into the provided context.
 *
 * @param context The extension context used for disposable registration.
 * @param deps Dependencies the command handlers act on.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  deps: CommandDependencies,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'thatVscodeRpc.enable',
      guard(() => handleEnable(deps)),
    ),
    vscode.commands.registerCommand(
      'thatVscodeRpc.disable',
      guard(() => handleDisable(deps)),
    ),
    vscode.commands.registerCommand(
      'thatVscodeRpc.reconnect',
      guard(() => handleReconnect(deps)),
    ),
    vscode.commands.registerCommand(
      'thatVscodeRpc.showStatus',
      guard(() => handleShowStatus(deps)),
    ),
    vscode.commands.registerCommand(
      'thatVscodeRpc.openLanguagePicker',
      guard(() => handleOpenLanguagePicker(deps)),
    ),
  );
}

/**
 * Wraps a command body so failures are logged and surfaced once, instead of
 * becoming an unhandled rejection inside the extension host.
 *
 * The wrapper returns the action's promise: VS Code (and tests) can await the
 * command, and a thrown error never escapes as an unhandled rejection.
 */
function guard(action: () => Promise<void> | void): () => Promise<void> {
  return async () => {
    try {
      await action();
    } catch (err) {
      getLogger().error('Command failed', err);
      void vscode.window.showErrorMessage(
        `That VSCode RPC: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };
}

async function handleEnable(deps: CommandDependencies): Promise<void> {
  await setEnabled(true);
  const config = readConfig();
  deps.getWatcher()?.updateConfig(config);
  const client = deps.getClient();
  client?.updateConfig(config);
  client?.connect();
  void vscode.window.showInformationMessage('That VSCode RPC enabled.');
}

async function handleDisable(deps: CommandDependencies): Promise<void> {
  await setEnabled(false);
  const config = readConfig();
  deps.getWatcher()?.updateConfig(config);
  // updateConfig sees `enabled === false` and clears the activity for us.
  deps.getClient()?.updateConfig(config);
  void vscode.window.showInformationMessage('That VSCode RPC disabled.');
}

async function handleReconnect(deps: CommandDependencies): Promise<void> {
  await deps.reconnect();
  void vscode.window.showInformationMessage('Reconnecting to Discord…');
}

function handleShowStatus(deps: CommandDependencies): void {
  deps.showLogger();

  const config = readConfig();
  const client = deps.getClient();
  const state = client?.getState() ?? 'disconnected';
  const details: string[] = [
    `Discord: ${state}`,
    config.general.enabled ? 'Presence: enabled' : 'Presence: disabled',
    `${SUPPORTED_LANGUAGES.length} language groups`,
    `Mode: ${config.languages.mode}`,
  ];
  void vscode.window.showInformationMessage(`That VSCode RPC — ${details.join(' · ')}`);
}

async function handleOpenLanguagePicker(deps: CommandDependencies): Promise<void> {
  await deps.openLanguagePicker();
}

async function setEnabled(enabled: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration(CONFIG_ROOT)
    .update('general.enabled', enabled, vscode.ConfigurationTarget.Global);
}
