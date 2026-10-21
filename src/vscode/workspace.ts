/**
 * Introspects the current VS Code workspace to produce the static context
 * that enriches an `ActivitySnapshot`.
 *
 * This module is intentionally read-only and side-effect-free apart from
 * optionally watching the workspace folders list. All calls are synchronous
 * so they can be invoked from event handlers without worrying about ordering.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Returns a human-readable name for the current workspace.
 *
 * Resolution order:
 * 1. Multi-root workspace name (`workspace.name` when >1 folder).
 * 2. The first workspace folder's basename.
 * 3. `undefined` when no folder is open.
 *
 * @returns The workspace name, or `undefined`.
 */
export function getWorkspaceName(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  if (folders.length === 1) {
    return folders[0].name;
  }
  return vscode.workspace.name ?? folders[0].name;
}

/**
 * Returns the root filesystem path of the current workspace, preferring the
 * folder that owns the active editor's file.
 *
 * @returns The absolute path to a workspace folder, or `undefined`.
 */
export function getWorkspaceRoot(): string | undefined {
  const active = vscode.window.activeTextEditor?.document.uri;
  if (active && active.scheme === 'file') {
    const owning = vscode.workspace.getWorkspaceFolder(active);
    if (owning) {
      return owning.uri.fsPath;
    }
  }
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}

/**
 * Reads the current git branch name for the workspace root, or `undefined`
 * when the workspace is not a git repository or HEAD cannot be parsed.
 *
 * Parsing `.git/HEAD` directly avoids shelling out to `git` and works even
 * when git is not installed. Linked worktrees (where `.git` is a file that
 * points at the real git directory) and detached HEADs are handled too.
 *
 * @returns The current branch name, short SHA, or `undefined`.
 */
export function getGitBranch(): string | undefined {
  const root = getWorkspaceRoot();
  if (!root) {
    return undefined;
  }

  const gitDir = resolveGitDir(root);
  if (!gitDir) {
    return undefined;
  }

  let head: string;
  try {
    head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  } catch {
    return undefined;
  }
  if (head.startsWith('ref: ')) {
    const ref = head.slice('ref: '.length);
    const lastSlash = ref.lastIndexOf('/');
    return lastSlash >= 0 ? ref.slice(lastSlash + 1) : ref;
  }
  return head.slice(0, 7);
}

/**
 * Resolves the git directory for `root`, following the `gitdir:` pointer used
 * by linked worktrees and submodules.
 */
function resolveGitDir(root: string): string | undefined {
  const dotGit = path.join(root, '.git');
  try {
    if (!fs.statSync(dotGit).isFile()) {
      return dotGit;
    }
    const pointer = fs.readFileSync(dotGit, 'utf8').trim();
    if (!pointer.startsWith('gitdir: ')) {
      return undefined;
    }
    return path.resolve(root, pointer.slice('gitdir: '.length).trim());
  } catch {
    return undefined;
  }
}

/**
 * Returns `true` when the given workspace name appears in the user's ignore
 * list. Comparison is case-insensitive.
 *
 * @param workspaceName The name from `getWorkspaceName`.
 * @param ignored The user's `ignore.workspaces` setting.
 */
export function isWorkspaceIgnored(
  workspaceName: string | undefined,
  ignored: readonly string[],
): boolean {
  if (!workspaceName || ignored.length === 0) {
    return false;
  }
  const lower = workspaceName.toLowerCase();
  return ignored.some((entry) => entry.toLowerCase() === lower);
}

/**
 * Returns `true` when the given VS Code language ID appears in the user's
 * ignore list. Comparison is exact; language IDs are lowercase by convention.
 *
 * @param languageId The document's language ID.
 * @param ignored The user's `ignore.languages` setting.
 */
export function isLanguageIgnored(
  languageId: string | undefined,
  ignored: readonly string[],
): boolean {
  if (!languageId || ignored.length === 0) {
    return false;
  }
  return ignored.includes(languageId);
}

/**
 * Emits `true` when workspace folders change. Used by the activity watcher
 * to force a snapshot refresh even if the active editor did not change.
 */
export class WorkspaceChangeWatcher implements vscode.Disposable {
  private readonly listener: vscode.Disposable;

  /**
   * @param callback Invoked whenever the set of workspace folders changes.
   */
  constructor(callback: () => void) {
    this.listener = vscode.workspace.onDidChangeWorkspaceFolders(() => callback());
  }

  /** Stops observing workspace changes. */
  dispose(): void {
    this.listener.dispose();
  }
}
