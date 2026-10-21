/**
 * Integrity and resolution tests for the language registry.
 *
 * Runs in plain Node — no VS Code required. Depends only on
 * `src/discord/supportedLanguages.ts`.
 */

import * as assert from 'node:assert/strict';

import {
  FALLBACK_ICON_KEY,
  NO_LANGUAGES_KEY,
  SUPPORTED_LANGUAGES,
  formatLanguageLabel,
  getAliasIndex,
  getAllIconKeys,
  getAllPermissionKeys,
  getDetailedLanguageIndex,
  getMainLanguageIndex,
  isPermissionKey,
  resolveIconKey,
  resolveLanguage,
} from '../../discord/supportedLanguages';

suite('supportedLanguages — registry integrity', () => {
  test('covers the documented number of language groups', () => {
    assert.ok(
      SUPPORTED_LANGUAGES.length >= 300,
      `expected at least 300 groups, found ${SUPPORTED_LANGUAGES.length}`,
    );
  });

  test('icon keys are unique', () => {
    const seen = new Set<string>();
    for (const entry of SUPPORTED_LANGUAGES) {
      assert.ok(!seen.has(entry.icon), `Duplicate icon key: ${entry.icon}`);
      seen.add(entry.icon);
    }
  });

  test('main language IDs are unique', () => {
    const seen = new Set<string>();
    for (const entry of SUPPORTED_LANGUAGES) {
      assert.ok(!seen.has(entry.mainLanguage), `Duplicate main language ID: ${entry.mainLanguage}`);
      seen.add(entry.mainLanguage);
    }
  });

  test('every detailed language is unique across the registry', () => {
    const seen = new Set<string>();
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const detail of entry.detailedLanguages) {
        assert.ok(
          !seen.has(detail),
          `Detailed language "${detail}" appears in more than one group`,
        );
        seen.add(detail);
      }
    }
  });

  test('no detailed language collides with a main icon key', () => {
    const mainIcons = new Set(getAllIconKeys());
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const detail of entry.detailedLanguages) {
        assert.ok(
          !mainIcons.has(detail),
          `"${detail}" is both a top-level icon and a detailed variant of "${entry.icon}"`,
        );
      }
    }
  });

  test('every group has a non-empty display name', () => {
    for (const entry of SUPPORTED_LANGUAGES) {
      assert.ok(entry.displayName.trim().length > 0, `Missing label for ${entry.icon}`);
    }
  });

  test('entries are sorted by icon key', () => {
    const sorted = [...SUPPORTED_LANGUAGES].sort((a, b) => a.icon.localeCompare(b.icon));
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      assert.equal(SUPPORTED_LANGUAGES[i].icon, sorted[i].icon);
    }
  });
});

suite('supportedLanguages — resolution', () => {
  test('resolves a main language in main mode', () => {
    const group = resolveLanguage('typescript', 'main');
    assert.equal(group?.mainLanguage, 'typescript');
  });

  test('does not resolve a detailed-only variant in main mode', () => {
    const group = resolveLanguage('cheader', 'main');
    assert.equal(group, undefined);
  });

  test('resolves a detailed variant in detailed mode', () => {
    const group = resolveLanguage('cheader', 'detailed');
    assert.equal(group?.icon, 'c');
  });

  test('resolves an alias language ID to its parent group', () => {
    assert.equal(resolveLanguage('dockerfile', 'main')?.icon, 'docker');
    assert.equal(resolveLanguage('jsonc', 'main')?.icon, 'json');
    assert.equal(resolveLanguage('shellscript', 'main')?.icon, 'shell');
  });

  test('resolves a variant that is also a real language ID in main mode', () => {
    assert.equal(resolveLanguage('scss', 'main')?.icon, 'sass');
  });

  test('resolveIconKey returns the detailed icon when enabled', () => {
    assert.equal(resolveIconKey('scss', 'detailed', ['scss']), 'scss');
  });

  test('resolveIconKey falls back to the parent group when the variant is disabled', () => {
    assert.equal(resolveIconKey('scss', 'detailed', ['sass']), 'sass');
  });

  test('resolveIconKey uses the parent icon in main mode', () => {
    assert.equal(resolveIconKey('scss', 'main', ['scss', 'sass']), 'sass');
  });

  test('resolveIconKey returns the language icon when everything is allowed', () => {
    assert.equal(resolveIconKey('scss', 'detailed', []), 'scss');
    assert.equal(resolveIconKey('typescript', 'detailed', []), 'typescript');
  });

  test('resolveIconKey hides every language when the none sentinel is set', () => {
    assert.equal(resolveIconKey('typescript', 'detailed', [NO_LANGUAGES_KEY]), FALLBACK_ICON_KEY);
  });

  test('resolveIconKey falls back for unregistered languages', () => {
    assert.equal(resolveIconKey('definitely-not-a-language', 'detailed', []), FALLBACK_ICON_KEY);
  });

  test('a specific enabled list filters precisely', () => {
    assert.equal(resolveIconKey('typescript', 'detailed', ['css']), FALLBACK_ICON_KEY);
    assert.equal(resolveIconKey('css', 'detailed', ['css']), 'css');
  });

  test('the detailed index points every variant back at its parent group', () => {
    const detailed = getDetailedLanguageIndex();
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const detail of entry.detailedLanguages) {
        assert.equal(detailed.get(detail)?.icon, entry.icon);
      }
    }
  });

  test('the main index maps every main language to its group', () => {
    const main = getMainLanguageIndex();
    for (const entry of SUPPORTED_LANGUAGES) {
      assert.equal(main.get(entry.mainLanguage)?.icon, entry.icon);
    }
  });

  test('the alias index maps every alias to its declaring group', () => {
    const aliases = getAliasIndex();
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const alias of entry.aliases) {
        assert.equal(aliases.get(alias), entry);
      }
    }
  });

  test('aliases never shadow a main language ID', () => {
    const main = getMainLanguageIndex();
    for (const alias of getAliasIndex().keys()) {
      assert.equal(main.has(alias), false, `Alias "${alias}" is also a main language ID`);
    }
  });
});

suite('supportedLanguages — permission keys', () => {
  test('mixes primary icons and toggleable variants', () => {
    const keys = new Set(getAllPermissionKeys());
    for (const entry of SUPPORTED_LANGUAGES) {
      assert.ok(keys.has(entry.icon), `Missing icon key ${entry.icon}`);
      for (const detail of entry.detailedLanguages) {
        assert.ok(keys.has(detail), `Missing detailed key ${detail}`);
      }
    }
  });

  test('accepts icons and variants but not aliases', () => {
    assert.equal(isPermissionKey('typescript'), true);
    assert.equal(isPermissionKey('scss'), true);
    assert.equal(isPermissionKey('dockerfile'), false);
    assert.equal(isPermissionKey('not-a-language'), false);
  });
});

suite('supportedLanguages — labels', () => {
  test('uses friendly labels where the ID would be mangled', () => {
    assert.equal(formatLanguageLabel('typescript'), 'TypeScript');
    assert.equal(formatLanguageLabel('csharp'), 'C#');
    assert.equal(formatLanguageLabel('objective-cpp'), 'Objective-C++');
  });

  test('title-cases unknown IDs as a fallback', () => {
    assert.equal(formatLanguageLabel('some_unknown-id'), 'Some Unknown Id');
  });
});
