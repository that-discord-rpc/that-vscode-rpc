# Changelog

All notable changes to That VSCode RPC are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-10-21

### Added

- Discord Rich Presence driven by a single activity watcher: file switches, saves, window focus, workspace changes, debug sessions, and idle transitions all produce updates.
- Template-based details and state lines supporting `{file}`, `{workspace}`, `{branch}`, and `{language}`, with per-value visibility toggles and Discord's 128-character limit enforced.
- A registry of 339 language groups, 3 detailed variants, and 148 alias language IDs, resolved through dedicated main, detailed, and alias indexes.
- Per-language visibility controls through the Webview language picker: search, main/detailed mode toggle, immediate writes, reset-to-all, and live refresh when settings change externally.
- Idle and debugging states with dedicated icons and labels.
- Per-workspace and per-language ignore lists.
- Up to two profile buttons with label and URL validation.
- Automatic reconnection with exponential backoff, plus a `disconnected` transport listener so a Discord restart is noticed.
- A five-per-twenty-seconds sliding-window limiter that queues and coalesces presence updates instead of hammering Discord.
- Fully typed configuration layer that validates, clamps, and defaults every value read from `settings.json`.
- Commands to enable, disable, reconnect, show status, and open the language picker.
- Git branch detection, including linked worktrees and detached HEADs, exposed through the `{branch}` placeholder.
- Test suites for registry integrity, icon and packaging assets, presence rendering, picker messages, configuration validation, activity snapshots, and rate limiting.
