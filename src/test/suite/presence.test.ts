/**
 * Rendering tests for `buildPresencePayload`.
 *
 * Pure: no VS Code host APIs and no Discord connection, so these run anywhere
 * the extension's modules can be imported.
 */

import * as assert from 'node:assert/strict';

import { DEFAULT_ASSET_BASE_URL } from '../../config/defaults';
import { buildPresencePayload } from '../../discord/presence';
import { resolveLanguage } from '../../discord/supportedLanguages';
import type { ActivitySnapshot } from '../../discord/types';
import { makeConfig, makeSnapshot } from '../support';

const ICON_BASE = DEFAULT_ASSET_BASE_URL;

function typescriptSnapshot(overrides: Partial<ActivitySnapshot> = {}): ActivitySnapshot {
  return makeSnapshot({
    fileName: 'index.ts',
    languageId: 'typescript',
    workspaceName: 'my-app',
    language: resolveLanguage('typescript', 'detailed'),
    ...overrides,
  });
}

suite('presence — text templates', () => {
  test('renders details, state, and the elapsed timestamp', () => {
    const payload = buildPresencePayload(typescriptSnapshot(), makeConfig());

    assert.equal(payload?.details, 'Editing index.ts');
    assert.equal(payload?.state, 'In my-app');
    assert.equal(payload?.startTimestamp, 1_700_000_000_000);
  });

  test('expands {language} with the friendly label', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({ details: { enabled: true, template: '{language}', showFileName: true } }),
    );

    assert.equal(payload?.details, 'TypeScript');
  });

  test('drops {file} when file names are hidden', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        details: { enabled: true, template: 'Editing {file}', showFileName: false },
      }),
    );

    assert.equal(payload?.details, 'Editing');
  });

  test('hides {file} on the state line too, not just the details line', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        details: { enabled: true, template: 'Editing {file}', showFileName: false },
        state: { enabled: true, template: '{file} in {workspace}', showWorkspaceName: true },
      }),
    );

    assert.equal(payload?.details, 'Editing');
    assert.equal(payload?.state, 'in my-app');
  });

  test('hides {workspace} when workspace names are hidden', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        state: { enabled: true, template: 'In {workspace}', showWorkspaceName: false },
      }),
    );

    assert.equal(payload?.state, 'In');
  });

  test('renders detailed variants with their own label', () => {
    const snapshot = makeSnapshot({
      fileName: 'styles.scss',
      languageId: 'scss',
      workspaceName: 'my-app',
      language: resolveLanguage('scss', 'detailed'),
    });

    const payload = buildPresencePayload(
      snapshot,
      makeConfig({ details: { enabled: true, template: '{language}', showFileName: true } }),
    );

    assert.equal(payload?.details, 'SCSS');
    assert.equal(payload?.largeImageText, 'SCSS');
  });

  test('expands {branch} and drops it outside a repository', () => {
    const template = makeConfig({
      details: { enabled: true, template: 'On {branch}', showFileName: true },
    });

    const withBranch = buildPresencePayload(
      typescriptSnapshot({ gitBranch: 'feature/icons' }),
      template,
    );
    const withoutBranch = buildPresencePayload(
      typescriptSnapshot({ gitBranch: undefined }),
      template,
    );

    assert.equal(withBranch?.details, 'On feature/icons');
    assert.equal(withoutBranch?.details, 'On');
  });

  test('strips unknown placeholders and collapses whitespace', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        details: { enabled: true, template: 'Working on {file} {mystery}', showFileName: true },
      }),
    );

    assert.equal(payload?.details, 'Working on index.ts');
  });

  test('truncates text to Discord’s 128 character limit', () => {
    const longName = `${'a'.repeat(200)}.ts`;
    const payload = buildPresencePayload(
      typescriptSnapshot({ fileName: longName }),
      makeConfig({ details: { enabled: true, template: '{file}', showFileName: true } }),
    );

    assert.equal(payload?.details?.length, 128);
  });

  test('omits disabled lines and empty templates', () => {
    const payload = buildPresencePayload(
      makeSnapshot(),
      makeConfig({
        details: { enabled: false, template: 'Editing {file}', showFileName: true },
        state: { enabled: true, template: '', showWorkspaceName: true },
        image: {
          enabled: false,
          useLanguageIcon: true,
          showVscodeIconAsSmall: true,
          baseUrl: ICON_BASE,
        },
        status: { showElapsedTime: false, resetOnFileChange: false },
      }),
    );

    assert.equal(payload, undefined);
  });
});

suite('presence — images', () => {
  test('uses the language icon as the large image', () => {
    const payload = buildPresencePayload(typescriptSnapshot(), makeConfig());

    assert.equal(payload?.largeImageKey, `${ICON_BASE}/languages/typescript.png`);
    assert.equal(payload?.largeImageText, 'TypeScript');
    assert.equal(payload?.smallImageKey, `${ICON_BASE}/states/vscode.png`);
  });

  test('uses the idle icon when the user is idle', () => {
    const payload = buildPresencePayload(typescriptSnapshot({ isIdle: true }), makeConfig());

    assert.equal(payload?.largeImageKey, `${ICON_BASE}/states/idle.png`);
    assert.equal(payload?.largeImageText, 'Idle');
  });

  test('uses the debugging icon while a debug session is active', () => {
    const payload = buildPresencePayload(typescriptSnapshot({ isDebugging: true }), makeConfig());

    assert.equal(payload?.largeImageKey, `${ICON_BASE}/states/debugging.png`);
    assert.equal(payload?.largeImageText, 'Debugging');
  });

  test('falls back to the VS Code icon for unregistered languages', () => {
    const payload = buildPresencePayload(
      makeSnapshot({ fileName: 'x.xyz', languageId: 'brainfuck', workspaceName: 'w' }),
      makeConfig(),
    );

    assert.equal(payload?.largeImageKey, `${ICON_BASE}/states/vscode.png`);
    assert.equal(payload?.smallImageKey, undefined);
  });

  test('omits the large image when the VS Code fallback is disabled', () => {
    const payload = buildPresencePayload(
      makeSnapshot({ fileName: 'x.xyz', languageId: 'brainfuck', workspaceName: 'w' }),
      makeConfig({
        languages: { mode: 'detailed', enabled: [], fallbackToVscodeIcon: false },
      }),
    );

    assert.equal(payload?.largeImageKey, undefined);
  });

  test('falls back when the matched language is hidden in the picker', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({ languages: { mode: 'detailed', enabled: ['css'], fallbackToVscodeIcon: true } }),
    );

    assert.equal(payload?.largeImageKey, `${ICON_BASE}/states/vscode.png`);
  });

  test('uses the detailed variant icon when it is enabled', () => {
    const snapshot = makeSnapshot({
      fileName: 'styles.scss',
      languageId: 'scss',
      workspaceName: 'my-app',
      language: resolveLanguage('scss', 'detailed'),
    });

    const detailed = buildPresencePayload(
      snapshot,
      makeConfig({
        languages: { mode: 'detailed', enabled: ['scss'], fallbackToVscodeIcon: true },
      }),
    );
    const parent = buildPresencePayload(
      snapshot,
      makeConfig({
        languages: { mode: 'detailed', enabled: ['sass'], fallbackToVscodeIcon: true },
      }),
    );

    assert.equal(detailed?.largeImageKey, `${ICON_BASE}/languages/scss.png`);
    assert.equal(detailed?.largeImageText, 'SCSS');
    assert.equal(parent?.largeImageKey, `${ICON_BASE}/languages/sass.png`);
    assert.equal(parent?.largeImageText, 'Sass');
  });

  test('omits images when image rendering is disabled', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        image: {
          enabled: false,
          useLanguageIcon: true,
          showVscodeIconAsSmall: true,
          baseUrl: ICON_BASE,
        },
      }),
    );

    assert.equal(payload?.largeImageKey, undefined);
    assert.equal(payload?.smallImageKey, undefined);
  });
});

suite('presence — buttons', () => {
  test('includes valid buttons and drops empty slots', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        buttons: {
          enabled: true,
          primary: { label: 'Repo', url: 'https://example.com/repo' },
          secondary: { label: '', url: '' },
        },
      }),
    );

    assert.deepEqual(payload?.buttons, [{ label: 'Repo', url: 'https://example.com/repo' }]);
  });

  test('omits buttons entirely when none are configured', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        buttons: {
          enabled: true,
          primary: { label: '', url: '' },
          secondary: { label: '', url: '' },
        },
      }),
    );

    assert.equal(payload?.buttons, undefined);
  });

  test('omits buttons when disabled', () => {
    const payload = buildPresencePayload(
      typescriptSnapshot(),
      makeConfig({
        buttons: {
          enabled: false,
          primary: { label: 'Repo', url: 'https://example.com/repo' },
          secondary: { label: '', url: '' },
        },
      }),
    );

    assert.equal(payload?.buttons, undefined);
  });
});
