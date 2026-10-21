/**
 * Validation tests for `readConfig`.
 *
 * Runs inside the VS Code test host so `workspace.getConfiguration` is
 * available. Each test writes to a temporary configuration scope, reads,
 * and resets to defaults.
 */

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { readConfig } from '../../config/settings';
import { DEFAULT_CONFIG } from '../../config/defaults';
import { getAllIconKeys } from '../../discord/supportedLanguages';

const CONFIG_ROOT = 'thatVscodeRpc';

async function withConfig(
  overrides: Record<string, unknown>,
  body: () => Promise<void> | void,
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration(CONFIG_ROOT);
  const applied: string[] = [];
  for (const [key, value] of Object.entries(overrides)) {
    await cfg.update(key, value, vscode.ConfigurationTarget.Global);
    applied.push(key);
  }
  try {
    await body();
  } finally {
    for (const key of applied) {
      await cfg.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  }
}

suite('settings — defaults', () => {
  test('returns the default config with no overrides', () => {
    const config = readConfig();
    assert.deepEqual(config.general.enabled, DEFAULT_CONFIG.general.enabled);
    assert.deepEqual(config.languages.mode, DEFAULT_CONFIG.languages.mode);
    assert.deepEqual(config.image.baseUrl, DEFAULT_CONFIG.image.baseUrl);
  });
});

suite('settings — validation', () => {
  test('clamps reconnectAttempts to >= 0', async () => {
    await withConfig({ 'general.reconnectAttempts': -5 }, () => {
      assert.equal(readConfig().general.reconnectAttempts, 0);
    });
  });

  test('clamps updateIntervalMs to the manifest minimum', async () => {
    await withConfig({ 'advanced.updateIntervalMs': 50 }, () => {
      assert.equal(readConfig().advanced.updateIntervalMs, 500);
    });
  });

  test('ignores unknown languages.enabled entries', async () => {
    const known = getAllIconKeys();
    const bogus = 'definitely-not-an-icon-key';
    assert.ok(!known.includes(bogus));
    await withConfig({ 'languages.enabled': ['css', bogus] }, () => {
      assert.deepEqual(readConfig().languages.enabled, ['css']);
    });
  });

  test('preserves an empty enabled list', async () => {
    await withConfig({ 'languages.enabled': [] }, () => {
      assert.deepEqual(readConfig().languages.enabled, []);
    });
  });

  test('rejects an invalid mode and falls back to the default', async () => {
    await withConfig({ 'languages.mode': 'nonexistent' }, () => {
      assert.equal(readConfig().languages.mode, DEFAULT_CONFIG.languages.mode);
    });
  });

  test('falls back to the default base URL when given an empty string', async () => {
    await withConfig({ 'image.baseUrl': '' }, () => {
      assert.equal(readConfig().image.baseUrl, DEFAULT_CONFIG.image.baseUrl);
    });
  });

  test('rejects asset base URLs Discord cannot fetch', async () => {
    for (const baseUrl of ['http://example.com/icons', 'javascript:alert(1)', 'not a url']) {
      await withConfig({ 'image.baseUrl': baseUrl }, () => {
        assert.equal(readConfig().image.baseUrl, DEFAULT_CONFIG.image.baseUrl, baseUrl);
      });
    }
  });

  test('accepts an https base URL and drops trailing slashes', async () => {
    await withConfig({ 'image.baseUrl': 'https://cdn.example.com/icons/' }, () => {
      assert.equal(readConfig().image.baseUrl, 'https://cdn.example.com/icons');
    });
  });

  test('leaves the client ID empty when none is configured', async () => {
    await withConfig({ 'general.clientId': '' }, () => {
      assert.equal(readConfig().general.clientId, '');
    });
  });

  test('trims whitespace around a configured client ID', async () => {
    await withConfig({ 'general.clientId': '  123456789012345678  ' }, () => {
      assert.equal(readConfig().general.clientId, '123456789012345678');
    });
  });

  test('truncates presence templates to Discord’s limit', async () => {
    await withConfig({ 'details.template': 'x'.repeat(300) }, () => {
      assert.equal(readConfig().details.template.length, 128);
    });
  });

  test('drops button URLs Discord cannot render', async () => {
    await withConfig({ 'buttons.primary': { label: 'Click', url: 'javascript:alert(1)' } }, () => {
      assert.equal(readConfig().buttons.primary.url, '');
      assert.equal(readConfig().buttons.primary.label, 'Click');
    });
  });

  test('keeps toggleable detailed variants and drops aliases', async () => {
    await withConfig({ 'languages.enabled': ['scss', 'jsonc'] }, () => {
      assert.deepEqual(readConfig().languages.enabled, ['scss']);
    });
  });

  test('preserves the none sentinel as the only enabled entry', async () => {
    await withConfig({ 'languages.enabled': ['__none__', 'css'] }, () => {
      assert.deepEqual(readConfig().languages.enabled, ['__none__']);
    });
  });
});
