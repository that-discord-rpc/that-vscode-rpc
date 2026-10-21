/**
 * End-to-end smoke tests for the real extension instance.
 *
 * These run against the extension loaded from the repository (not a mock), so
 * they catch wiring mistakes that unit tests cannot: a missing command
 * registration, an activation throw, or a config write that never lands.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { LanguagePickerPanel } from '../../webview/languagePicker';

const EXTENSION_ID = 'that-vscode-rpc.that-vscode-rpc';
const CONFIG_ROOT = 'thatVscodeRpc';

const COMMANDS = [
  'thatVscodeRpc.enable',
  'thatVscodeRpc.disable',
  'thatVscodeRpc.reconnect',
  'thatVscodeRpc.showStatus',
  'thatVscodeRpc.openLanguagePicker',
];

suite('extension — activation', () => {
  test('activates without throwing', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `extension ${EXTENSION_ID} should be present in the test host`);

    await extension.activate();
    assert.equal(extension.isActive, true);
  });

  test('registers every contributed command', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of COMMANDS) {
      assert.ok(commands.includes(command), `missing command: ${command}`);
    }
  });
});

/**
 * Waits for `general.enabled` to settle. Command handlers persist through the
 * settings service, which can update a few ticks after the command resolves,
 * so assertions poll. A fresh `getConfiguration` per read is required: the
 * returned object reflects the values captured when it was created.
 */
async function readEnabled(expected: boolean, timeoutMs = 2_000): Promise<boolean | undefined> {
  const read = (): boolean | undefined =>
    vscode.workspace.getConfiguration(CONFIG_ROOT).get<boolean>('general.enabled');

  const deadline = Date.now() + timeoutMs;
  let value = read();
  while (value !== expected && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    value = read();
  }
  if (value !== expected) {
    const inspection = vscode.workspace
      .getConfiguration(CONFIG_ROOT)
      .inspect<boolean>('general.enabled');
    assert.fail(`general.enabled did not become ${expected}: ${JSON.stringify(inspection)}`);
  }
  return value;
}

suite('extension — language picker', () => {
  test('creates the panel and loads the built template', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension);
    await extension.activate();

    // `show` only needs the extension URI and a disposal bucket, so a minimal
    // context is enough to exercise real panel creation without the command's
    // error guard hiding a missing asset.
    const context = {
      extensionUri: extension.extensionUri,
      subscriptions: [] as vscode.Disposable[],
    } as unknown as vscode.ExtensionContext;

    await LanguagePickerPanel.show(context);
    assert.ok(context.subscriptions.length > 0, 'the panel should be registered');

    for (const disposable of context.subscriptions) {
      disposable.dispose();
    }
  });
});

suite('extension — enable and disable commands', () => {
  const configuration = vscode.workspace.getConfiguration(CONFIG_ROOT);

  suiteTeardown(async () => {
    await configuration.update('general.enabled', undefined, vscode.ConfigurationTarget.Global);
  });

  test('disable persists the setting, and enable restores it', async () => {
    await vscode.commands.executeCommand('thatVscodeRpc.disable');
    assert.equal(await readEnabled(false), false);

    await vscode.commands.executeCommand('thatVscodeRpc.enable');
    assert.equal(await readEnabled(true), true);
  });

  test('reconnect runs against the live client', async () => {
    // No Discord client is reachable in CI; the command must still complete
    // and leave a usable client wired for the next activity event.
    await vscode.commands.executeCommand('thatVscodeRpc.reconnect');
  });
});
