/**
 * Owns the Discord RPC connection lifecycle and pushes Rich Presence payloads.
 *
 * Responsibilities:
 * - Connect to the local Discord desktop client via IPC.
 * - Reconnect automatically when Discord restarts, honoring the user's
 *   `reconnectOnDisconnect` and `reconnectAttempts` settings.
 * - Send Rich Presence payloads built by `presence.ts` (pure, unit-tested).
 * - Emit connection state events for observability (commands, logging).
 *
 * This is the only module permitted to import `discord-rpc`.
 */

import * as RPC from 'discord-rpc';

import { isValidDiscordClientId } from '../config/defaults';
import type {
  ActivitySnapshot,
  ClientEvent,
  ConnectionState,
  DiscordConfig,
  RichPresencePayload,
} from './types';
import { buildPresencePayload } from './presence';
import { SlidingWindowLimiter } from './rateLimiter';
import { getLogger } from '../utils/logger';

const RECONNECT_BASE_DELAY_MS = 2_000;
const RECONNECT_MAX_DELAY_MS = 60_000;

/** Discord permits five presence updates per twenty seconds. */
const PRESENCE_RATE_LIMIT = 5;
const PRESENCE_RATE_WINDOW_MS = 20_000;

/**
 * Manages the Discord RPC connection and pushes Rich Presence updates.
 *
 * Lifecycle: construct with a validated config, call `connect()`, call
 * `updateConfig()` on configuration change, call `dispose()` on shutdown.
 * Subscribe to connection events via `onEvent()`.
 */
export class DiscordClient {
  private rpc: RPC.Client | undefined;
  private config: DiscordConfig;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private lastSnapshot: ActivitySnapshot | undefined;
  private disposed = false;
  private readonly handlers = new Set<(event: ClientEvent) => void>();
  private readonly limiter = new SlidingWindowLimiter(PRESENCE_RATE_LIMIT, PRESENCE_RATE_WINDOW_MS);
  /** Newest payload waiting for Discord's rate-limit budget. */
  private pendingPayload: RichPresencePayload | undefined;
  private flushTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * @param config The validated configuration to apply.
   */
  constructor(config: DiscordConfig) {
    this.config = config;
  }

  /** Returns the current connection state. */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Subscribes to connection lifecycle events.
   *
   * @param handler Called for each event.
   * @returns A disposable that unsubscribes the handler.
   */
  onEvent(handler: (event: ClientEvent) => void): { dispose: () => void } {
    this.handlers.add(handler);
    return { dispose: () => this.handlers.delete(handler) };
  }

  /**
   * Initiates the connection to Discord. Calls while disabled, disposed, or
   * already connected/connecting/reconnecting are ignored.
   */
  connect(): void {
    if (this.disposed || !this.config.general.enabled || this.state !== 'disconnected') {
      return;
    }
    void this.login();
  }

  /**
   * Replaces the configuration and re-renders the last known snapshot so the
   * presence reflects the new settings immediately.
   *
   * Disabling presence clears the activity. Changing the Discord application
   * ID tears the connection down and reconnects with the new identity.
   */
  updateConfig(config: DiscordConfig): void {
    const clientIdChanged = config.general.clientId !== this.config.general.clientId;
    this.config = config;

    if (!config.general.enabled) {
      this.cancelReconnect();
      this.reconnectAttempt = 0;
      void this.clearActivity();
      // Tear down a connection that belongs to the previous application ID,
      // even while presence is disabled, so re-enabling starts cleanly.
      if (clientIdChanged) {
        void this.restart();
      }
      return;
    }

    if (clientIdChanged) {
      void this.restart();
      return;
    }

    if (this.lastSnapshot) {
      void this.setActivity(this.lastSnapshot);
    }
  }

  /**
   * Applies an activity snapshot. When the snapshot has no displayable
   * content (ignored workspace, ignored language, no editor), presence is
   * cleared rather than left stale.
   *
   * @param snapshot The snapshot produced by the activity watcher.
   */
  async setActivity(snapshot: ActivitySnapshot): Promise<void> {
    this.lastSnapshot = snapshot;

    if (this.disposed || !this.config.general.enabled || this.state !== 'connected') {
      return;
    }

    if (!hasDisplayableContent(snapshot)) {
      await this.clearActivity();
      return;
    }

    const payload = buildPresencePayload(snapshot, this.config);
    if (!payload) {
      await this.clearActivity();
      return;
    }

    this.pushPayload(payload);
  }

  /** Clears the current Rich Presence. The connection remains open. */
  async clearActivity(): Promise<void> {
    // A queued payload would otherwise resurrect stale presence after the
    // clear, once the rate-limit window opens.
    this.discardPendingPayload();
    if (!this.rpc || this.state !== 'connected') {
      return;
    }
    try {
      await this.rpc.clearActivity();
    } catch (err) {
      getLogger().error('Failed to clear Discord activity', err);
    }
  }

  /**
   * Disconnects from Discord, cancels any pending reconnect, and clears all
   * event handlers. Safe to call multiple times.
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.cancelReconnect();
    this.handlers.clear();
    await this.destroyRpc();
    this.state = 'disconnected';
  }

  /**
   * Re-establishes the connection after a fatal configuration change.
   * Event subscriptions survive; the activity is re-sent once ready.
   */
  private async restart(): Promise<void> {
    if (this.disposed) {
      return;
    }
    this.cancelReconnect();
    this.reconnectAttempt = 0;
    await this.destroyRpc();
    this.state = 'disconnected';
    this.connect();
  }

  private async login(): Promise<void> {
    if (this.disposed || !this.config.general.enabled) {
      return;
    }

    const clientId = this.config.general.clientId;
    if (!isValidDiscordClientId(clientId)) {
      const error = new Error(
        'No valid Discord application ID is configured. Set ' +
          'thatVscodeRpc.general.clientId to the 17-20 digit ID of a Discord ' +
          'application to enable Rich Presence.',
      );
      getLogger().error(error.message);
      this.state = 'disconnected';
      this.emit({ type: 'error', error });
      return;
    }

    this.setState('connecting');
    const rpc = new RPC.Client({ transport: 'ipc' });
    this.rpc = rpc;

    // The transport closes when Discord quits or restarts. Without this
    // listener the client would keep a dead socket and never reconnect.
    rpc.on('disconnected', () => {
      if (this.rpc === rpc) {
        this.handleDisconnect('Discord desktop client disconnected');
      }
    });

    try {
      await rpc.login({ clientId });
    } catch (err) {
      if (this.rpc === rpc) {
        this.rpc = undefined;
      }
      this.handleDisconnect('initial connection failed', err);
      return;
    }

    if (this.disposed || this.rpc !== rpc) {
      try {
        await rpc.destroy();
      } catch {
        // The connection is already unusable; nothing to clean up.
      }
      return;
    }

    this.reconnectAttempt = 0;
    this.setState('connected');
    this.emit({ type: 'connected' });
    getLogger().info('Connected to Discord');

    if (this.lastSnapshot) {
      // setActivity handles "nothing displayable" by clearing instead.
      await this.setActivity(this.lastSnapshot);
    }
  }

  private handleDisconnect(reason: string, error?: unknown): void {
    if (this.disposed) {
      return;
    }
    if (this.state === 'disconnected' || this.state === 'reconnecting') {
      return;
    }

    void this.destroyRpc();
    this.emit({ type: 'disconnected', reason });
    getLogger().warn(`Discord disconnected: ${reason}`, error);

    if (!this.config.general.enabled || !this.config.general.reconnectOnDisconnect) {
      this.setState('disconnected');
      return;
    }

    const max = this.config.general.reconnectAttempts;
    if (max > 0 && this.reconnectAttempt >= max) {
      getLogger().error('Discord reconnect attempts exhausted');
      this.setState('disconnected');
      return;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');
    this.reconnectAttempt += 1;
    const max = this.config.general.reconnectAttempts;

    this.emit({
      type: 'reconnecting',
      attempt: this.reconnectAttempt,
      maxAttempts: max,
    });

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempt - 1),
      RECONNECT_MAX_DELAY_MS,
    );

    this.cancelReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.disposed) {
        return;
      }
      this.state = 'disconnected';
      if (this.config.general.enabled) {
        void this.login();
      }
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private async destroyRpc(): Promise<void> {
    const rpc = this.rpc;
    this.rpc = undefined;
    this.clearPendingPayload();
    if (!rpc) {
      return;
    }
    try {
      await rpc.destroy();
    } catch {
      // Connection may already be gone; nothing to clean up.
    }
  }

  private pushPayload(payload: RichPresencePayload): void {
    // Keep only the newest payload: intermediate states are already stale by
    // the time Discord's budget frees up.
    this.pendingPayload = payload;
    this.flushPendingPayload();
  }

  /**
   * Sends the newest pending payload, deferring it when the sliding window is
   * full. A single timer coalesces every update that arrives while waiting.
   */
  private flushPendingPayload(): void {
    if (this.flushTimer !== undefined) {
      return;
    }

    const rpc = this.rpc;
    if (!rpc || this.state !== 'connected' || !this.pendingPayload) {
      this.pendingPayload = undefined;
      return;
    }

    const waitMs = this.limiter.tryAcquire();
    if (waitMs > 0) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = undefined;
        this.flushPendingPayload();
      }, waitMs);
      return;
    }

    const payload = this.pendingPayload;
    this.pendingPayload = undefined;
    void rpc.setActivity(payload).catch((err: unknown) => {
      // Discord rejects malformed payloads; a closed socket emits
      // `disconnected` instead, so this never triggers a reconnect.
      getLogger().error('Failed to set Discord activity', err);
    });
  }

  /** Cancels a queued payload without touching the rate-limit budget. */
  private discardPendingPayload(): void {
    if (this.flushTimer !== undefined) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.pendingPayload = undefined;
  }

  /** Drops queued work and frees the rate-limit window for a new socket. */
  private clearPendingPayload(): void {
    this.discardPendingPayload();
    this.limiter.reset();
  }

  private setState(next: ConnectionState): void {
    this.state = next;
  }

  private emit(event: ClientEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        getLogger().error('DiscordClient event handler failed', err);
      }
    }
  }
}

/**
 * Returns `true` when the snapshot describes something worth showing.
 * Everything else clears the presence instead of leaving a stale line.
 */
function hasDisplayableContent(snapshot: ActivitySnapshot): boolean {
  return Boolean(snapshot.fileName || snapshot.workspaceName || snapshot.languageId);
}
