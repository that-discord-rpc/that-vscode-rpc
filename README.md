# That VSCode RPC

> Discord Rich Presence for Visual Studio Code. Every line, every label, every icon — yours.

That VSCode RPC shows what you are working on in your Discord profile: the file, the workspace, the language, and how long you have been at it. It is built around a typed, validated settings layer and a registry of 339 language groups, with per-language visibility controls so you decide exactly what is shared.

## Features

- **Live Rich Presence.** Updates when you switch files, save, change workspace, start debugging, or go idle.
- **Template-based text.** Build the details and state lines from `{file}`, `{workspace}`, `{branch}`, and `{language}`, with unresolved placeholders collapsed rather than left dangling.
- **339 language groups, 148 extra language IDs.** Icons are served from plain PNG URLs, so no Discord Developer Portal asset uploads are needed.
- **Per-language visibility.** Untick a language in the picker and it never appears — not as text, not as an icon.
- **Detailed or main mode.** Show `scss` and header variants distinctly, or roll them into their parent group.
- **Idle and debugging states** with dedicated icons and labels.
- **Ignore lists** for workspaces and language IDs.
- **Up to two profile buttons**, validated against what Discord can actually render.
- **Rate-limit aware.** Discord allows five presence updates per 20 seconds; the client queues and coalesces updates instead of failing.
- **Automatic reconnect** with exponential backoff when Discord restarts.

## Requirements

- Visual Studio Code **1.85** or newer.
- The **Discord desktop client** running on the same machine. Rich Presence does not work with Discord in a browser, and it does not work over Remote SSH, WSL, or a container.
- A **Discord application ID** of your own (see below). The extension does not ship one: Discord ties presence to an application you own, and no bot, token, or OAuth flow is involved.

## Quick Start

1. Install the extension.
2. Create an application at <https://discord.com/developers/applications> (**New Application**, any name), then copy its **Application ID** from the General Information page.
3. In VS Code, open **Settings** and set `thatVscodeRpc.general.clientId` to that ID — or run **That VSCode RPC: Show Status**, which opens the log and reports a missing ID.
4. Open a file. Your Discord profile now shows the extension's presence.

You can also set the ID in `settings.json`:

```jsonc
{
  "thatVscodeRpc.general.clientId": "123456789012345678"
}
```

## Settings

Every setting lives under `thatVscodeRpc.*`. Search for `That VSCode RPC` in the Settings UI to see them grouped.

### General

| Setting | Default | Description |
| --- | --- | --- |
| `thatVscodeRpc.general.enabled` | `true` | Enable Rich Presence. |
| `thatVscodeRpc.general.clientId` | `""` | Your Discord Application ID (17–20 digits). Required. |
| `thatVscodeRpc.general.reconnectOnDisconnect` | `true` | Reconnect automatically when Discord restarts. |
| `thatVscodeRpc.general.reconnectAttempts` | `5` | Maximum attempts before giving up (`0` = unlimited). |
| `thatVscodeRpc.general.idleTimeoutMinutes` | `5` | Minutes without activity before the idle state (`0` = disabled). |

### Languages

| Setting | Default | Description |
| --- | --- | --- |
| `thatVscodeRpc.languages.mode` | `detailed` | Resolve detailed variants (`scss`) or main groups (`sass`). |
| `thatVscodeRpc.languages.enabled` | `[]` | Keys permitted to be shown. Empty means all; edit visually with the language picker. Hiding every language stores `__none__`. |
| `thatVscodeRpc.languages.fallbackToVscodeIcon` | `true` | Show the VS Code icon when no permitted language matches. |

### Text

| Setting | Default | Description |
| --- | --- | --- |
| `thatVscodeRpc.details.enabled` | `true` | Show the details line. |
| `thatVscodeRpc.details.template` | `Editing {file}` | Details line template. |
| `thatVscodeRpc.details.showFileName` | `true` | Expand `{file}`. When off, `{file}` is removed from both lines. |
| `thatVscodeRpc.state.enabled` | `true` | Show the state line. |
| `thatVscodeRpc.state.template` | `In {workspace}` | State line template. |
| `thatVscodeRpc.state.showWorkspaceName` | `true` | Expand `{workspace}`. When off, `{workspace}` is removed from both lines. |

Templates are truncated to Discord's 128-character limit, and repeated whitespace left behind by an empty placeholder is collapsed. `{branch}` expands to the current git branch, read from `.git/HEAD` (linked worktrees and detached HEADs included); it is empty outside a repository.

### Images and time

| Setting | Default | Description |
| --- | --- | --- |
| `thatVscodeRpc.image.enabled` | `true` | Show images at all. |
| `thatVscodeRpc.image.useLanguageIcon` | `true` | Use the language icon as the large image. |
| `thatVscodeRpc.image.showVscodeIconAsSmall` | `true` | Show the VS Code icon as the small image. |
| `thatVscodeRpc.image.baseUrl` | GitHub raw URL | HTTPS base URL for `languages/` and `states/` icons. |
| `thatVscodeRpc.status.showElapsedTime` | `true` | Show elapsed session time. |
| `thatVscodeRpc.status.resetOnFileChange` | `false` | Reset the timer when the active file changes. |

### Ignore, buttons, misc, advanced

| Setting | Default | Description |
| --- | --- | --- |
| `thatVscodeRpc.ignore.workspaces` | `[]` | Workspace names where presence is cleared. |
| `thatVscodeRpc.ignore.languages` | `[]` | Language IDs that are never shown. |
| `thatVscodeRpc.buttons.enabled` | `false` | Enable profile buttons. |
| `thatVscodeRpc.buttons.primary` | `{ "label": "", "url": "" }` | Primary button. Both fields are required. |
| `thatVscodeRpc.buttons.secondary` | `{ "label": "", "url": "" }` | Secondary button. |
| `thatVscodeRpc.misc.debugLogging` | `false` | Verbose logging in the output channel. |
| `thatVscodeRpc.advanced.updateIntervalMs` | `1500` | Minimum gap between updates (floor 500). |
| `thatVscodeRpc.advanced.suppressUntitledFiles` | `true` | Do not publish untitled buffers. |

Button labels are capped at 32 characters and URLs must be absolute `http(s)` URLs, because Discord silently drops anything else.

## Commands

Open the Command Palette and type `That VSCode RPC`:

- **Enable** / **Disable** — flip presence on or off.
- **Reconnect** — dispose the current connection and connect again.
- **Show Status** — reveal the output channel and report connection state, mode, and registry size.
- **Open Language Picker** — visual tree for per-language visibility.

## The Language Picker

Run **That VSCode RPC: Open Language Picker**. Every language group is a parent row with its detailed variants indented below. Toggling a checkbox writes `thatVscodeRpc.languages.enabled` immediately — there is no save button — and changes made in `settings.json` are reflected back into the open panel.

In **main** mode, `scss` files show the `sass` icon. In **detailed** mode, `scss` shows the `scss` icon when that variant is enabled; otherwise it falls back to the parent. **Reset to all** stores an empty list, which means "every language, including ones added in future releases". Unticking the last language stores the `__none__` sentinel, so "hide everything" survives a reload instead of silently re-enabling all languages.

## How Icons Work

Icons are PNG files hosted in this repository and referenced by absolute URL, so the extension package contains only the extension icon. A missing or blocked image is hidden by the picker and simply omitted by Discord.

To host your own icons, point `thatVscodeRpc.image.baseUrl` at a directory laid out like this:

```text
<baseUrl>/
  languages/
    typescript.png
    css.png
    …
  states/
    vscode.png
    debugging.png
    idle.png
```

The base URL must be world-readable over HTTPS; Discord fetches the images itself, and non-HTTPS values are rejected. The bundled default points at this repository's `main` branch, so a fork must publish the same layout or change the setting.

## Privacy

The extension sends only what you enable to Discord's local IPC socket: the rendered details/state text, the selected icon URLs, and a session start timestamp. It never uploads file contents, and it never talks to a server other than the image host configured in `thatVscodeRpc.image.baseUrl` (Discord fetches those images). Untitled buffers are skipped by default, and `thatVscodeRpc.details.showFileName` removes file names from every line.

## Troubleshooting

**Presence does not appear.**

- The Discord desktop client must be running and signed in.
- `thatVscodeRpc.general.clientId` must be set to your own application ID; check **Show Status** for the exact error.
- Rich Presence is unavailable in Remote SSH, WSL, containers, and vscode.dev, because the extension cannot reach the local Discord socket there.

**Presence lags behind file switches.**

- Updates are throttled to `thatVscodeRpc.advanced.updateIntervalMs` and to Discord's five-per-20-seconds budget. The newest state is queued and sent as soon as the budget allows.

**An icon is blank.**

- Verify the URL in a browser; a 404 means the asset is missing at your `image.baseUrl`.
- Private or authenticated image hosts do not work, because Discord fetches the URL itself.

**A language never shows.**

- Check the picker (the language or its parent must be ticked) and `thatVscodeRpc.ignore.languages`.
- With `fallbackToVscodeIcon` off, a hidden language intentionally produces no large image.

## Development

```bash
npm install
npm run build        # bundle extension + Webview into dist/
npm run watch        # rebuild on change
npm run lint
npm run typecheck          # extension and test sources
npm run typecheck:webview  # checked Webview script (JavaScript)
npm test                   # downloads VS Code and runs the integration suite
npm run package      # build a .vsix with vsce
```

`npm test` uses `@vscode/test-electron`, so it needs network access the first time. `npm run test:unit` runs the pure-Node suites (registry integrity, presence rendering, picker messages, rate limiting) without downloading VS Code.

## Contributing

Issues and pull requests are welcome at <https://github.com/that-discord-rpc/that-vscode-rpc>. See `CHANGELOG.md` for release notes.

## License

MIT. See `LICENSE`.
