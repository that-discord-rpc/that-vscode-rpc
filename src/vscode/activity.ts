/**
 * Watches VS Code editor and window events and emits `ActivitySnapshot`
 * objects representing what Rich Presence should currently display.
 *
 * This module is the sole producer of `ActivitySnapshot`. It knows nothing
 * about Discord. It receives a validated `DiscordConfig` at construction
 * time and applies the user's ignore lists, detail mode, and idle timeout
 * before emitting each snapshot.
 *
 * Emissions are debounced and throttled to keep Rich Presence updates within
 * Discord's rate limits. Consumers only ever see the final resolved state.
 */

import * as vscode from 'vscode';

import type { ActivitySnapshot, DiscordConfig } from '../discord/types';
import { resolveLanguage } from '../discord/supportedLanguages';
import { throttle } from '../utils/debounce';
import { getLogger } from '../utils/logger';
import {
  getGitBranch,
  getWorkspaceName,
  isLanguageIgnored,
  isWorkspaceIgnored,
  WorkspaceChangeWatcher,
} from './workspace';

/** Slack added to the idle timer so the threshold is definitely crossed. */
const IDLE_TIMER_SLACK_MS = 50;

/**
 * Receives `ActivitySnapshot` updates. Consumers must not throw; if they do,
 * the error is logged and the watcher continues.
 */
export type SnapshotHandler = (snapshot: ActivitySnapshot) => void;

/**
 * Watches editor, document, focus, debug, and workspace events, and emits
 * `ActivitySnapshot` objects on change.
 *
 * Lifecycle: construct, subscribe with `onSnapshot`, call `dispose()` on
 * extension shutdown.
 */
export class ActivityWatcher implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly handlers = new Set<SnapshotHandler>();

  private emitThrottled: (() => void) & { cancel: () => void };
  private updateIntervalMs: number;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  /** Set when the next emission must bypass the "nothing changed" check. */
  private forceNextEmit = false;

  private config: DiscordConfig;
  private sessionStart = Date.now();
  private lastActivity = Date.now();
  private lastFileName: string | undefined;
  private lastSnapshot: ActivitySnapshot | undefined;
  private lastSnapshotKey: string | undefined;
  private disposed = false;

  /**
   * @param config The validated configuration to apply. Call `updateConfig`
   * when configuration changes.
   */
  constructor(config: DiscordConfig) {
    this.config = config;
    this.updateIntervalMs = config.advanced.updateIntervalMs;
    this.emitThrottled = throttle(() => this.emit(), this.updateIntervalMs);

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => this.handleActivity()),
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
          this.handleActivity();
        }
      }),
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.handleActivity();
        } else {
          this.requestEmit();
        }
      }),
      vscode.workspace.onDidSaveTextDocument(() => this.handleActivity()),
      vscode.debug.onDidStartDebugSession(() => this.requestEmit()),
      vscode.debug.onDidTerminateDebugSession(() => this.requestEmit()),
      new WorkspaceChangeWatcher(() => this.handleActivity()),
    );

    this.scheduleIdleCheck();

    // Publish the state that existed before activation (an already-open
    // editor produces no change event), once every constructor subscriber
    // has had a chance to attach.
    queueMicrotask(() => this.requestEmit());
  }

  /**
   * Replaces the current configuration and re-emits an updated snapshot.
   * Existing subscriptions are preserved. A changed update interval is applied
   * immediately by rebuilding the throttled emitter.
   */
  updateConfig(config: DiscordConfig): void {
    this.config = config;

    if (config.advanced.updateIntervalMs !== this.updateIntervalMs) {
      this.updateIntervalMs = config.advanced.updateIntervalMs;
      this.emitThrottled.cancel();
      this.emitThrottled = throttle(() => this.emit(), this.updateIntervalMs);
    }

    this.scheduleIdleCheck();
    this.requestEmit(true);
  }

  /**
   * Subscribes to snapshot updates.
   *
   * @param handler Called for each emitted snapshot.
   * @returns A disposable that unsubscribes the handler.
   */
  onSnapshot(handler: SnapshotHandler): vscode.Disposable {
    this.handlers.add(handler);
    return { dispose: () => this.handlers.delete(handler) };
  }

  /** Returns the most recently emitted snapshot, if any. */
  getLastSnapshot(): ActivitySnapshot | undefined {
    return this.lastSnapshot;
  }

  /** Stops observing events and clears all handlers. */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.emitThrottled.cancel();
    this.forceNextEmit = false;
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.handlers.clear();
  }

  private handleActivity(): void {
    this.lastActivity = Date.now();

    const fileName = vscode.window.activeTextEditor
      ? getFileName(vscode.window.activeTextEditor)
      : undefined;
    if (this.config.status.resetOnFileChange && fileName !== this.lastFileName) {
      this.sessionStart = Date.now();
    }
    this.lastFileName = fileName;

    this.requestEmit();
    this.scheduleIdleCheck();
  }

  /**
   * (Re)schedules the single pending idle transition. When the timeout is
   * disabled, or the user is already idle, no timer is left behind.
   */
  private scheduleIdleCheck(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    if (this.disposed) {
      return;
    }

    const timeoutMs = this.config.general.idleTimeoutMinutes * 60_000;
    if (timeoutMs <= 0) {
      return;
    }

    const elapsed = Date.now() - this.lastActivity;
    if (elapsed >= timeoutMs) {
      // Already idle: the snapshot reflects it. Wait for the next activity.
      return;
    }

    this.idleTimer = setTimeout(
      () => {
        this.idleTimer = undefined;
        this.requestEmit();
      },
      timeoutMs - elapsed + IDLE_TIMER_SLACK_MS,
    );
  }

  /**
   * Queues an emission through the throttle, remembering whether it must be
   * sent even if the payload-relevant state is unchanged.
   */
  private requestEmit(force = false): void {
    this.forceNextEmit = this.forceNextEmit || force;
    this.emitThrottled();
  }

  /**
   * Emits the current snapshot, skipping snapshots identical to the last one
   * in every field that affects the Discord payload. Keystrokes change
   * `lastActivity` on every character; forwarding those would exhaust
   * Discord's presence rate limit without changing what users see.
   */
  private emit(): void {
    if (this.disposed) {
      return;
    }
    const snapshot = this.buildSnapshot();
    const key = snapshotKey(snapshot);
    const force = this.forceNextEmit;
    this.forceNextEmit = false;
    if (!force && key === this.lastSnapshotKey) {
      return;
    }
    this.lastSnapshotKey = key;
    this.lastSnapshot = snapshot;
    for (const handler of this.handlers) {
      try {
        handler(snapshot);
      } catch (err) {
        getLogger().error('ActivityWatcher handler failed', err);
      }
    }
  }

  private buildSnapshot(): ActivitySnapshot {
    const idleMs = this.config.general.idleTimeoutMinutes * 60_000;
    const isIdle = idleMs > 0 && Date.now() - this.lastActivity >= idleMs;
    const base: ActivitySnapshot = {
      isIdle,
      isDebugging: vscode.debug.activeDebugSession !== undefined,
      sessionStart: this.sessionStart,
      lastActivity: this.lastActivity,
    };

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return base;
    }

    const document = editor.document;
    if (this.config.advanced.suppressUntitledFiles && document.uri.scheme === 'untitled') {
      return base;
    }

    const workspaceName = getWorkspaceName();
    if (isWorkspaceIgnored(workspaceName, this.config.ignore.workspaces)) {
      return base;
    }

    const languageId = document.languageId;
    if (isLanguageIgnored(languageId, this.config.ignore.languages)) {
      return base;
    }

    return {
      ...base,
      fileName: getFileName(editor),
      languageId,
      workspaceName,
      gitBranch: getGitBranch(),
      language: resolveLanguage(languageId, this.config.languages.mode),
    };
  }
}

/**
 * Serializes the fields that change the rendered presence. Deliberately
 * excludes `lastActivity`, which moves on every keystroke but never appears
 * in the payload.
 */
function snapshotKey(snapshot: ActivitySnapshot): string {
  return [
    snapshot.fileName ?? '',
    snapshot.languageId ?? '',
    snapshot.workspaceName ?? '',
    snapshot.gitBranch ?? '',
    snapshot.language?.icon ?? '',
    snapshot.sessionStart,
    snapshot.isIdle ? '1' : '0',
    snapshot.isDebugging ? '1' : '0',
  ].join('\u0000');
}

/** Returns the basename of the editor's document, if it has one. */
function getFileName(editor: vscode.TextEditor): string | undefined {
  const base = editor.document.fileName.split(/[\\/]/).pop();
  return base && base.length > 0 ? base : undefined;
}
