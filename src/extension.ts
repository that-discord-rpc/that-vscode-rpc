/**
 * Extension entry point.
 *
 * Composition only. This file creates every module, wires them together,
 * and registers their disposables with the VS Code context. It contains no
 * business logic — every meaningful decision lives in a dedicated module.
 *
 * Wired modules:
 * - `ConfigWatcher` observes settings.
 * - `ActivityWatcher` produces snapshots from VS Code events.
 * - `DiscordClient` consumes snapshots and drives Rich Presence.
 * - `registerCommands` exposes user-facing actions.
 * - `LanguagePickerPanel` owns the Webview, loaded lazily.
 */

import * as vscode from 'vscode';

import { isValidDiscordClientId } from './config/defaults';
import { readConfig, ConfigWatcher } from './config/settings';
import { DiscordClient } from './discord/client';
import type { ClientEvent, DiscordConfig } from './discord/types';
import { ActivityWatcher } from './vscode/activity';
import { registerCommands } from './commands';
import { getLogger } from './utils/logger';

/** The client currently driving Rich Presence, if any. */
let activeClient: DiscordClient | undefined;
let activityWatcher: ActivityWatcher | undefined;
let configWatcher: ConfigWatcher | undefined;
/** Keeps the "missing application ID" warning to once per session. */
let warnedAboutClientId = false;

/**
 * Called by VS Code when the extension activates. Constructs every module,
 * wires their interactions, and registers their disposables.
 *
 * Activation always completes, even when presence is disabled in settings, so
 * the enable/disable commands remain available to bring it back.
 *
 * @param context The extension context used for lifecycle management.
 */
export function activate(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  logger.info('That VSCode RPC activating…');

  const initialConfig = readConfig();
  logger.setLevel(initialConfig.misc.debugLogging ? 'debug' : 'info');

  const watcher = new ActivityWatcher(initialConfig);
  activityWatcher = watcher;

  // One long-lived subscriber; it always forwards to the current client, so
  // reconnects cannot accumulate stale handlers.
  watcher.onSnapshot((snapshot) => {
    void activeClient?.setActivity(snapshot);
  });

  const wire = (config: DiscordConfig): DiscordClient => {
    const client = new DiscordClient(config);
    client.onEvent(handleClientEvent);
    activeClient = client;
    return client;
  };

  const reconnect = async (): Promise<void> => {
    const previous = activeClient;
    activeClient = undefined;
    await previous?.dispose();

    const client = wire(readConfig());
    client.connect();

    const snapshot = watcher.getLastSnapshot();
    if (snapshot) {
      void client.setActivity(snapshot);
    }
  };

  const client = wire(initialConfig);
  if (initialConfig.general.enabled) {
    client.connect();
  } else {
    logger.info('Rich Presence is disabled in settings.');
  }

  configWatcher = new ConfigWatcher((next) => {
    logger.setLevel(next.misc.debugLogging ? 'debug' : 'info');
    if (isValidDiscordClientId(next.general.clientId)) {
      // A valid ID was configured; a future removal should warn again.
      warnedAboutClientId = false;
    }
    watcher.updateConfig(next);
    activeClient?.updateConfig(next);
    if (next.general.enabled) {
      activeClient?.connect();
    }
  });

  registerCommands(context, {
    getClient: () => activeClient,
    getWatcher: () => activityWatcher,
    showLogger: () => logger.show(),
    openLanguagePicker: async () => {
      const { LanguagePickerPanel } = await import('./webview/languagePicker.js');
      await LanguagePickerPanel.show(context);
    },
    reconnect,
  });

  context.subscriptions.push({ dispose: () => void activeClient?.dispose() }, watcher, {
    dispose: () => configWatcher?.dispose(),
  });

  logger.info('That VSCode RPC activated.');
}

/**
 * Called by VS Code when the extension deactivates. Disposes every module
 * in reverse dependency order so downstream modules stop receiving events
 * before upstream modules shut down.
 */
export async function deactivate(): Promise<void> {
  const logger = getLogger();
  logger.info('That VSCode RPC deactivating…');

  configWatcher?.dispose();
  configWatcher = undefined;

  activityWatcher?.dispose();
  activityWatcher = undefined;

  const client = activeClient;
  activeClient = undefined;
  await client?.dispose();

  logger.info('That VSCode RPC deactivated.');
}

/** Routes client lifecycle events to the log and one actionable warning. */
function handleClientEvent(event: ClientEvent): void {
  const logger = getLogger();
  switch (event.type) {
    case 'connected':
      logger.info('Discord connected');
      break;
    case 'disconnected':
      logger.warn(`Discord disconnected: ${event.reason}`);
      break;
    case 'reconnecting':
      logger.info(`Discord reconnect attempt ${event.attempt}/${event.maxAttempts}`);
      break;
    case 'error':
      logger.error('Discord client error', event.error);
      warnAboutMissingClientId(event.error);
      break;
  }
}

/**
 * Surfaces a one-time, actionable warning when Rich Presence cannot start
 * because no Discord application ID is configured.
 */
function warnAboutMissingClientId(error: Error): void {
  if (warnedAboutClientId || !error.message.includes('application ID')) {
    return;
  }
  warnedAboutClientId = true;
  void vscode.window
    .showWarningMessage(error.message, 'Open Settings', 'Create Application')
    .then((choice) => {
      if (choice === 'Open Settings') {
        void vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'thatVscodeRpc.general.clientId',
        );
      } else if (choice === 'Create Application') {
        void vscode.env.openExternal(
          vscode.Uri.parse('https://discord.com/developers/applications'),
        );
      }
    });
}
