/**
 * Filesystem integrity checks for the shipped artifacts.
 *
 * The registry, the package manifest, and the icon assets are three separate
 * files that must agree; these tests fail loudly when they drift apart.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { FALLBACK_ICON_KEY, SUPPORTED_LANGUAGES } from '../../discord/supportedLanguages';

// `out/test/suite` → repository root.
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ASSETS = path.join(PROJECT_ROOT, 'assets');

/** Returns `true` when the icon file exists under `assets/languages`. */
function languageIconExists(icon: string): boolean {
  return fs.existsSync(path.join(ASSETS, 'languages', `${icon}.png`));
}

suite('assets — registry icons', () => {
  test('every primary icon has a PNG asset', () => {
    const missing = SUPPORTED_LANGUAGES.map((entry) => entry.icon).filter(
      (icon) => !languageIconExists(icon),
    );
    assert.deepEqual(missing, [], `Missing icon files: ${missing.join(', ')}`);
  });

  test('every detailed variant has a PNG asset', () => {
    const missing: string[] = [];
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const detail of entry.detailedLanguages) {
        if (!languageIconExists(detail)) {
          missing.push(detail);
        }
      }
    }
    assert.deepEqual(missing, [], `Missing variant icons: ${missing.join(', ')}`);
  });

  test('state icons exist', () => {
    for (const name of ['vscode', 'debugging', 'idle']) {
      assert.ok(
        fs.existsSync(path.join(ASSETS, 'states', `${name}.png`)),
        `Missing state icon: ${name}.png`,
      );
    }
  });

  test('the fallback key is not a language icon', () => {
    assert.equal(languageIconExists(FALLBACK_ICON_KEY), false);
  });
});

suite('assets — packaging', () => {
  test('the extension icon exists where package.json points', () => {
    const manifestPath = path.join(PROJECT_ROOT, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { icon?: string };

    assert.equal(manifest.icon, 'assets/logos/icon.png');
    assert.ok(
      fs.existsSync(path.join(PROJECT_ROOT, manifest.icon ?? '')),
      'package.json icon must exist and be packaged',
    );
  });

  test('the extension icon is at least 128px and under 1 MB', () => {
    const iconPath = path.join(PROJECT_ROOT, 'assets', 'logos', 'icon.png');
    const buffer = fs.readFileSync(iconPath);
    // PNG IHDR: 8-byte signature, 4-byte length, 4-byte type, then width/height.
    assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    assert.ok(width >= 128 && height >= 128, `icon is ${width}x${height}`);
    assert.ok(buffer.byteLength < 1_000_000, `icon is ${buffer.byteLength} bytes`);
  });

  test('the VSIX manifest entry point matches the build output', () => {
    const manifestPath = path.join(PROJECT_ROOT, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { main?: string };
    assert.equal(manifest.main, './dist/extension.js');
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'extension.js')));
  });

  test('the Webview build outputs exist', () => {
    for (const name of ['languagePicker.html', 'languagePicker.css', 'languagePicker.js']) {
      assert.ok(
        fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'webview', name)),
        `Missing Webview build output: ${name}`,
      );
    }
  });

  test('the Webview template keeps every placeholder the panel replaces', () => {
    const html = fs.readFileSync(
      path.join(PROJECT_ROOT, 'dist', 'webview', 'languagePicker.html'),
      'utf8',
    );

    for (const placeholder of ['{{csp}}', '{{styleUri}}', '{{scriptUri}}', '{{nonce}}']) {
      assert.ok(html.includes(placeholder), `template is missing ${placeholder}`);
    }
    assert.ok(
      /<script nonce="\{\{nonce\}\}"/.test(html),
      'the script tag must be nonce-guarded so the CSP allows it',
    );
  });

  test('the Webview stylesheet covers every class the script toggles', () => {
    const css = fs.readFileSync(
      path.join(PROJECT_ROOT, 'dist', 'webview', 'languagePicker.css'),
      'utf8',
    );
    for (const className of ['.group', '.row', '.row.main', '.row.child', '.row.hidden']) {
      assert.ok(css.includes(className), `CSS is missing ${className}`);
    }
  });
});
