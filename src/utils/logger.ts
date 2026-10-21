/**
 * Output-channel-backed logger.
 *
 * Every module in the extension logs through a `Logger` instance so users can
 * inspect Rich Presence behavior without opening DevTools. The output channel
 * is created lazily on first use; a single shared instance is exposed through
 * `getLogger()`.
 */

import * as vscode from 'vscode';

/** Severity levels supported by the logger. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CHANNEL_NAME = 'That VS Code RPC';

/**
 * A thin wrapper around a VS Code output channel with level filtering and
 * timestamps. All instances share a single output channel.
 */
export class Logger implements vscode.Disposable {
  private static channel: vscode.OutputChannel | undefined;
  private level: LogLevel = 'info';

  /** Sets the minimum level to emit. Lower levels are dropped. */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /** Emits a debug-level message. */
  debug(message: string): void {
    this.write('debug', message);
  }

  /** Emits an info-level message. */
  info(message: string): void {
    this.write('info', message);
  }

  /** Emits a warning-level message, optionally with an attached error. */
  warn(message: string, error?: unknown): void {
    this.write('warn', message + describeError(error));
  }

  /** Emits an error-level message, optionally with an attached error. */
  error(message: string, error?: unknown): void {
    this.write('error', message + describeError(error));
  }

  /** Reveals the underlying output channel to the user. */
  show(): void {
    Logger.getChannel().show(true);
  }

  /** No-op; the shared channel outlives any individual logger. */
  dispose(): void {
    // Channel is shared and disposed by the extension host on shutdown.
  }

  private write(level: LogLevel, message: string): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) {
      return;
    }
    const timestamp = new Date().toISOString();
    Logger.getChannel().appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  private static getChannel(): vscode.OutputChannel {
    if (!Logger.channel) {
      Logger.channel = vscode.window.createOutputChannel(CHANNEL_NAME);
    }
    return Logger.channel;
  }
}

let sharedLogger: Logger | undefined;

/**
 * Formats an optional error value for appending to a log line.
 *
 * @returns `": message"`, or an empty string when no error was supplied.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `: ${error.message}`;
  }
  if (error !== undefined && error !== null) {
    return `: ${String(error)}`;
  }
  return '';
}

/** Returns the shared logger instance, creating it on first call. */
export function getLogger(): Logger {
  if (!sharedLogger) {
    sharedLogger = new Logger();
  }
  return sharedLogger;
}
