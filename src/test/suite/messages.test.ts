/**
 * Tests for the Webview message contract and the picker tree builder.
 */

import * as assert from 'node:assert/strict';

import { NO_LANGUAGES_KEY, SUPPORTED_LANGUAGES } from '../../discord/supportedLanguages';
import { buildPickerGroups, isWebviewMessage } from '../../webview/messages';

suite('webview — picker groups', () => {
  test('treats an empty enabled list as "everything checked"', () => {
    const groups = buildPickerGroups(SUPPORTED_LANGUAGES, []);
    assert.equal(groups.length, SUPPORTED_LANGUAGES.length);
    for (const group of groups) {
      assert.equal(group.main.enabled, true);
      for (const child of group.children) {
        assert.equal(child.enabled, true);
      }
    }
  });

  test('reflects an explicit enabled list per row', () => {
    const groups = buildPickerGroups(SUPPORTED_LANGUAGES, ['scss']);
    const sass = groups.find((group) => group.main.icon === 'sass');

    assert.ok(sass, 'expected a sass group');
    assert.equal(sass?.main.enabled, false);
    assert.equal(sass?.children.find((child) => child.icon === 'scss')?.enabled, true);
  });

  test('uses friendly display labels for both levels', () => {
    const groups = buildPickerGroups(SUPPORTED_LANGUAGES, []);
    const typescript = groups.find((group) => group.main.icon === 'typescript');
    const sass = groups.find((group) => group.main.icon === 'sass');

    assert.equal(typescript?.main.label, 'TypeScript');
    assert.equal(sass?.children[0]?.label, 'SCSS');
  });

  test('renders every row unchecked when the none sentinel is stored', () => {
    const groups = buildPickerGroups(SUPPORTED_LANGUAGES, [NO_LANGUAGES_KEY]);
    assert.equal(
      groups.every((group) => !group.main.enabled && group.children.every((row) => !row.enabled)),
      true,
    );
  });

  test('rows are sorted by icon key', () => {
    const groups = buildPickerGroups(SUPPORTED_LANGUAGES, []);
    const icons = groups.map((group) => group.main.icon);
    const sorted = [...icons].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(icons, sorted);
  });
});

suite('webview — message validation', () => {
  test('accepts every documented message shape', () => {
    assert.equal(isWebviewMessage({ type: 'ready' }), true);
    assert.equal(isWebviewMessage({ type: 'toggle', icon: 'css', enabled: true }), true);
    assert.equal(isWebviewMessage({ type: 'setMode', mode: 'main' }), true);
    assert.equal(isWebviewMessage({ type: 'save', enabled: ['css'] }), true);
  });

  test('rejects malformed payloads', () => {
    assert.equal(isWebviewMessage(undefined), false);
    assert.equal(isWebviewMessage(null), false);
    assert.equal(isWebviewMessage('ready'), false);
    assert.equal(isWebviewMessage({ type: 'toggle', icon: 'css' }), false);
    assert.equal(isWebviewMessage({ type: 'setMode', mode: 'other' }), false);
    assert.equal(isWebviewMessage({ type: 'save', enabled: [1, 2] }), false);
    assert.equal(isWebviewMessage({ type: 'unknown' }), false);
  });
});
