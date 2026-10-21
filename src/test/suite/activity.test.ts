/**
 * Snapshot-shape tests for `ActivityWatcher`.
 *
 * Runs inside the VS Code test host so real editor and workspace APIs are
 * available. Each test opens a real document on disk, then waits for a
 * matching snapshot with a bounded poll — no fixed sleeps.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

import { ActivityWatcher } from '../../vscode/activity';
import type { ActivitySnapshot, DiscordConfig } from '../../discord/types';
import { makeConfig } from '../support';

const WAIT_TIMEOUT_MS = 5_000;
const TEST_INTERVAL_MS = 100;

let workspaceDir: string;
let sampleFile: string;
let otherFile: string;

suiteSetup(() => {
  workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'that-vscode-rpc-test-'));
  sampleFile = path.join(workspaceDir, 'sample.ts');
  otherFile = path.join(workspaceDir, 'other.py');
  fs.writeFileSync(sampleFile, 'const value = 1;\n', 'utf8');
  fs.writeFileSync(otherFile, 'value = 1\n', 'utf8');
});

suiteTeardown(() => {
  fs.rmSync(workspaceDir, { recursive: true, force: true });
});

/** Opens a document on disk and focuses it. */
async function openFile(filePath: string): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(document);
  return document;
}

/** Resolves with the first snapshot (including the latest one) matching `predicate`. */
function waitForSnapshot(
  watcher: ActivityWatcher,
  predicate: (snapshot: ActivitySnapshot) => boolean,
): Promise<ActivitySnapshot> {
  const existing = watcher.getLastSnapshot();
  if (existing && predicate(existing)) {
    return Promise.resolve(existing);
  }

  return new Promise<ActivitySnapshot>((resolve, reject) => {
    const timer = setTimeout(() => {
      subscription.dispose();
      reject(new Error('No matching snapshot emitted within the timeout'));
    }, WAIT_TIMEOUT_MS);

    const subscription = watcher.onSnapshot((snapshot) => {
      if (!predicate(snapshot)) {
        return;
      }
      clearTimeout(timer);
      subscription.dispose();
      resolve(snapshot);
    });
  });
}

/** Creates a watcher whose throttle is short enough for tests. */
function createWatcher(overrides: Partial<DiscordConfig> = {}): ActivityWatcher {
  const config = makeConfig({
    ...overrides,
    advanced: {
      updateIntervalMs: TEST_INTERVAL_MS,
      suppressUntitledFiles: true,
      ...overrides.advanced,
    },
  });
  return new ActivityWatcher(config);
}

suite('activity — snapshot shape', () => {
  test('emits the active file name, language, and registry group', async () => {
    const watcher = createWatcher();
    try {
      const expected = waitForSnapshot(watcher, (snapshot) => snapshot.fileName === 'sample.ts');
      await openFile(sampleFile);
      const snapshot = await expected;

      assert.equal(snapshot.languageId, 'typescript');
      assert.equal(snapshot.fileName, 'sample.ts');
      assert.equal(snapshot.language?.mainLanguage, 'typescript');
      assert.equal(snapshot.isIdle, false);
      assert.equal(snapshot.isDebugging, false);
    } finally {
      watcher.dispose();
    }
  });

  test('suppresses untitled files when configured', async () => {
    const watcher = createWatcher();
    try {
      const expected = waitForSnapshot(watcher, (snapshot) => snapshot.languageId === undefined);
      const document = await vscode.workspace.openTextDocument({
        content: 'hello',
        language: 'plaintext',
      });
      await vscode.window.showTextDocument(document);
      const snapshot = await expected;

      assert.equal(snapshot.fileName, undefined);
      assert.equal(snapshot.languageId, undefined);
    } finally {
      watcher.dispose();
    }
  });

  test('suppresses ignored languages', async () => {
    const watcher = createWatcher({ ignore: { workspaces: [], languages: ['typescript'] } });
    try {
      const expected = waitForSnapshot(watcher, (snapshot) => snapshot.languageId === undefined);
      await openFile(sampleFile);
      const snapshot = await expected;

      assert.equal(snapshot.languageId, undefined);
      assert.equal(snapshot.fileName, undefined);
    } finally {
      watcher.dispose();
    }
  });

  test('reports the session start used for the elapsed timer', async () => {
    const watcher = createWatcher();
    const before = Date.now();
    try {
      const expected = waitForSnapshot(watcher, (snapshot) => snapshot.fileName === 'sample.ts');
      await openFile(sampleFile);
      const snapshot = await expected;

      assert.ok(snapshot.sessionStart <= Date.now());
      assert.ok(snapshot.sessionStart >= before - 1_000);
      assert.ok(snapshot.lastActivity >= snapshot.sessionStart);
    } finally {
      watcher.dispose();
    }
  });

  test('stops emitting after dispose', async () => {
    const watcher = createWatcher();
    let emissions = 0;
    watcher.onSnapshot(() => {
      emissions++;
    });
    await openFile(sampleFile);
    await new Promise((resolve) => setTimeout(resolve, TEST_INTERVAL_MS * 2));
    const beforeDispose = emissions;
    assert.ok(beforeDispose > 0, 'expected at least one snapshot before dispose');

    watcher.dispose();
    await openFile(otherFile);
    await new Promise((resolve) => setTimeout(resolve, TEST_INTERVAL_MS * 2));
    assert.equal(emissions, beforeDispose);
  });
});
