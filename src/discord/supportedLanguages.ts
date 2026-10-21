/**
 * The canonical registry of languages and icons supported by That VSCode RPC.
 *
 * Each entry maps an icon key (which resolves to `assets/languages/<icon>.png`)
 * to a primary VS Code language ID, optional detailed variants, and aliases.
 *
 * Entries mirror the language manifest of the vscode-icons project
 * (https://github.com/vscode-icons/vscode-icons), filtered to the icon files
 * that ship in `assets/languages`. A few icons are remapped to the file name
 * used by this asset set, and additional VS Code language IDs share a parent
 * group icon through `aliases`.
 *
 * Rules (enforced by `supportedLanguages.test.ts`):
 * - `icon` is unique across the array. It is the primary key.
 * - Every `icon` and every `detailedLanguages` entry has a PNG in
 *   `assets/languages/`.
 * - `detailedLanguages` entries are unique, never repeat a top-level `icon`,
 *   and are only matched in `detailed` mode.
 * - `aliases` are additional VS Code language IDs that render the group icon
 *   and are never separately toggleable.
 */

/** A single language group in the registry. */
export interface SupportedLanguage {
  /** Icon key; the file is `assets/languages/<icon>.png`. */
  icon: string;
  /** Primary VS Code language ID for the group. */
  mainLanguage: string;
  /** Human-readable label for the picker. */
  displayName: string;
  /** Toggleable variants that use their own icon in `detailed` mode. */
  detailedLanguages: string[];
  /** Extra VS Code language IDs that share this group icon. */
  aliases: string[];
}

/**
 * The icon key used when no language matches or the user has hidden the
 * matched language. It is intentionally not a registry entry: the VS Code
 * icon lives under `assets/states/`, not `assets/languages/`.
 */
export const FALLBACK_ICON_KEY = 'vscode';

/**
 * Sentinel stored in `languages.enabled` when the user has hidden every
 * language. An empty array must keep meaning "no restriction", so hiding the
 * last language needs a value that is not a permission key.
 */
export const NO_LANGUAGES_KEY = '__none__';

/** Returns `true` when the enabled list hides every language. */
export function isNothingEnabled(enabled: readonly string[]): boolean {
  return enabled.includes(NO_LANGUAGES_KEY);
}

/** The full registry, sorted by `icon`. */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    icon: 'actionscript',
    mainLanguage: 'actionscript',
    displayName: 'Actionscript',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'ada', mainLanguage: 'ada', displayName: 'Ada', detailedLanguages: [], aliases: [] },
  {
    icon: 'advpl',
    mainLanguage: 'advpl',
    displayName: 'Advpl',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'agda',
    mainLanguage: 'agda',
    displayName: 'Agda',
    detailedLanguages: [],
    aliases: ['lagda-md', 'lagda-rst', 'lagda-tex'],
  },
  { icon: 'al', mainLanguage: 'al', displayName: 'Al', detailedLanguages: [], aliases: [] },
  {
    icon: 'alloy',
    mainLanguage: 'alloy',
    displayName: 'Alloy',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'ansible',
    mainLanguage: 'ansible',
    displayName: 'Ansible',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'antlr',
    mainLanguage: 'antlr',
    displayName: 'Antlr',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'anyscript',
    mainLanguage: 'anyscript',
    displayName: 'Anyscript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'apache',
    mainLanguage: 'apacheconf',
    displayName: 'Apacheconf',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'apex', mainLanguage: 'apex', displayName: 'Apex', detailedLanguages: [], aliases: [] },
  {
    icon: 'apib',
    mainLanguage: 'apiblueprint',
    displayName: 'Apiblueprint',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'apl', mainLanguage: 'apl', displayName: 'Apl', detailedLanguages: [], aliases: [] },
  {
    icon: 'applescript',
    mainLanguage: 'applescript',
    displayName: 'Applescript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'asciidoc',
    mainLanguage: 'asciidoc',
    displayName: 'AsciiDoc',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'asp',
    mainLanguage: 'asp',
    displayName: 'Asp',
    detailedLanguages: [],
    aliases: ['asp (html)'],
  },
  {
    icon: 'assembly',
    mainLanguage: 'arm',
    displayName: 'Arm',
    detailedLanguages: [],
    aliases: ['asm', 'asm-intel-x86-generic', 'asm-collection'],
  },
  {
    icon: 'astro',
    mainLanguage: 'astro',
    displayName: 'Astro',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'ats', mainLanguage: 'ats', displayName: 'Ats', detailedLanguages: [], aliases: [] },
  {
    icon: 'autoit',
    mainLanguage: 'autoit',
    displayName: 'Autoit',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'avro', mainLanguage: 'avro', displayName: 'Avro', detailedLanguages: [], aliases: [] },
  {
    icon: 'azurestreamanalytics',
    mainLanguage: 'asaql',
    displayName: 'Asaql',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'ballerina',
    mainLanguage: 'ballerina',
    displayName: 'Ballerina',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'bat', mainLanguage: 'bat', displayName: 'Bat', detailedLanguages: [], aliases: [] },
  { icon: 'bats', mainLanguage: 'bats', displayName: 'Bats', detailedLanguages: [], aliases: [] },
  {
    icon: 'bazel',
    mainLanguage: 'bazel',
    displayName: 'Bazel',
    detailedLanguages: [],
    aliases: ['bazelrc', 'starlark'],
  },
  {
    icon: 'befunge',
    mainLanguage: 'befunge',
    displayName: 'Befunge',
    detailedLanguages: [],
    aliases: ['befunge98'],
  },
  {
    icon: 'bicep',
    mainLanguage: 'bicep',
    displayName: 'Bicep',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'biml', mainLanguage: 'biml', displayName: 'Biml', detailedLanguages: [], aliases: [] },
  {
    icon: 'binary',
    mainLanguage: 'code-text-binary',
    displayName: 'Code Text Binary',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'biome',
    mainLanguage: 'biome_syntax_tree',
    displayName: 'Biome Syntax Tree',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'blade',
    mainLanguage: 'blade',
    displayName: 'Blade',
    detailedLanguages: [],
    aliases: ['laravel-blade'],
  },
  {
    icon: 'blitzbasic',
    mainLanguage: 'blitzbasic',
    displayName: 'Blitzbasic',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'bolt', mainLanguage: 'bolt', displayName: 'Bolt', detailedLanguages: [], aliases: [] },
  {
    icon: 'bosque',
    mainLanguage: 'bosque',
    displayName: 'Bosque',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'browserslist',
    mainLanguage: 'browserslist',
    displayName: 'Browserslist',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'bruno',
    mainLanguage: 'bruno',
    displayName: 'Bruno',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'buf',
    mainLanguage: 'buf',
    displayName: 'Buf',
    detailedLanguages: [],
    aliases: ['buf-gen'],
  },
  {
    icon: 'bun',
    mainLanguage: 'bun.lockb',
    displayName: 'Bun Lockb',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'c', mainLanguage: 'c', displayName: 'C', detailedLanguages: ['cheader'], aliases: [] },
  { icon: 'c_al', mainLanguage: 'c-al', displayName: 'C Al', detailedLanguages: [], aliases: [] },
  { icon: 'c3', mainLanguage: 'c3', displayName: 'C3', detailedLanguages: [], aliases: [] },
  {
    icon: 'cabal',
    mainLanguage: 'cabal',
    displayName: 'Cabal',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'cairo',
    mainLanguage: 'cairo',
    displayName: 'Cairo',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'cangjie',
    mainLanguage: 'Cangjie',
    displayName: 'Cangjie',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'capnp',
    mainLanguage: 'capnp',
    displayName: 'Capnp',
    detailedLanguages: [],
    aliases: ['capnproto'],
  },
  { icon: 'casc', mainLanguage: 'casc', displayName: 'Casc', detailedLanguages: [], aliases: [] },
  { icon: 'cddl', mainLanguage: 'cddl', displayName: 'Cddl', detailedLanguages: [], aliases: [] },
  {
    icon: 'ceylon',
    mainLanguage: 'ceylon',
    displayName: 'Ceylon',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'circom',
    mainLanguage: 'circom',
    displayName: 'Circom',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'clojure',
    mainLanguage: 'clojure',
    displayName: 'Clojure',
    detailedLanguages: [],
    aliases: ['clojurescript'],
  },
  {
    icon: 'cmake',
    mainLanguage: 'cmake',
    displayName: 'CMake',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'cobol',
    mainLanguage: 'cobol',
    displayName: 'COBOL',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'codeql', mainLanguage: 'ql', displayName: 'Ql', detailedLanguages: [], aliases: [] },
  {
    icon: 'coffeescript',
    mainLanguage: 'coffeescript',
    displayName: 'Coffeescript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'confluence',
    mainLanguage: 'confluence',
    displayName: 'Confluence',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'copilot',
    mainLanguage: 'instructions',
    displayName: 'Instructions',
    detailedLanguages: [],
    aliases: ['prompt'],
  },
  {
    icon: 'cpp',
    mainLanguage: 'cpp',
    displayName: 'C++',
    detailedLanguages: ['cppheader'],
    aliases: [],
  },
  {
    icon: 'crystal',
    mainLanguage: 'crystal',
    displayName: 'Crystal',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'csharp', mainLanguage: 'csharp', displayName: 'C#', detailedLanguages: [], aliases: [] },
  { icon: 'css', mainLanguage: 'css', displayName: 'CSS', detailedLanguages: [], aliases: [] },
  {
    icon: 'cucumber',
    mainLanguage: 'cucumber',
    displayName: 'Cucumber',
    detailedLanguages: [],
    aliases: ['feature'],
  },
  {
    icon: 'cuda',
    mainLanguage: 'cuda',
    displayName: 'Cuda',
    detailedLanguages: [],
    aliases: ['cuda-cpp'],
  },
  { icon: 'cue', mainLanguage: 'cue', displayName: 'Cue', detailedLanguages: [], aliases: [] },
  {
    icon: 'cython',
    mainLanguage: 'cython',
    displayName: 'Cython',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'dal', mainLanguage: 'dal', displayName: 'Dal', detailedLanguages: [], aliases: [] },
  {
    icon: 'dartlang',
    mainLanguage: 'dart',
    displayName: 'Dart',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'debian',
    mainLanguage: 'debian-changelog',
    displayName: 'Debian Changelog',
    detailedLanguages: [],
    aliases: ['debian-control', 'debian-copyright', 'debian-upstream-metadata'],
  },
  {
    icon: 'delphi',
    mainLanguage: 'pascal',
    displayName: 'Pascal',
    detailedLanguages: [],
    aliases: ['objectpascal'],
  },
  {
    icon: 'dhall',
    mainLanguage: 'dhall',
    displayName: 'Dhall',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'dlang',
    mainLanguage: 'd',
    displayName: 'D',
    detailedLanguages: [],
    aliases: ['dscript', 'dml', 'diet'],
  },
  {
    icon: 'docker',
    mainLanguage: 'dockerfile',
    displayName: 'Dockerfile',
    detailedLanguages: [],
    aliases: ['dockercompose', 'dockerbake'],
  },
  {
    icon: 'dotenv',
    mainLanguage: 'dotenv',
    displayName: 'Dotenv',
    detailedLanguages: [],
    aliases: ['env'],
  },
  {
    icon: 'dotjs',
    mainLanguage: 'dotjs',
    displayName: 'Dotjs',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'doxyfile',
    mainLanguage: 'doxyfile',
    displayName: 'Doxyfile',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'doxygen',
    mainLanguage: 'doxygen',
    displayName: 'Doxygen',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'drawio',
    mainLanguage: 'drawio',
    displayName: 'Drawio',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'drools',
    mainLanguage: 'drools',
    displayName: 'Drools',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'dtd', mainLanguage: 'dtd', displayName: 'Dtd', detailedLanguages: [], aliases: [] },
  {
    icon: 'dylan',
    mainLanguage: 'dylan',
    displayName: 'Dylan',
    detailedLanguages: [],
    aliases: ['dylan-lid'],
  },
  { icon: 'edge', mainLanguage: 'edge', displayName: 'Edge', detailedLanguages: [], aliases: [] },
  {
    icon: 'editorconfig',
    mainLanguage: 'editorconfig',
    displayName: 'Editorconfig',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'eex',
    mainLanguage: 'eex',
    displayName: 'Eex',
    detailedLanguages: [],
    aliases: ['html-eex'],
  },
  { icon: 'ejs', mainLanguage: 'ejs', displayName: 'Ejs', detailedLanguages: [], aliases: [] },
  { icon: 'elastic', mainLanguage: 'es', displayName: 'Es', detailedLanguages: [], aliases: [] },
  {
    icon: 'elixir',
    mainLanguage: 'elixir',
    displayName: 'Elixir',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'elm', mainLanguage: 'elm', displayName: 'Elm', detailedLanguages: [], aliases: [] },
  {
    icon: 'erb',
    mainLanguage: 'erb',
    displayName: 'Erb',
    detailedLanguages: [],
    aliases: ['html.erb'],
  },
  {
    icon: 'erlang',
    mainLanguage: 'erlang',
    displayName: 'Erlang',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'esphome',
    mainLanguage: 'esphome',
    displayName: 'Esphome',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'excel',
    mainLanguage: 'excel',
    displayName: 'Excel',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'falcon',
    mainLanguage: 'falcon',
    displayName: 'Falcon',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'fauna', mainLanguage: 'fql', displayName: 'Fql', detailedLanguages: [], aliases: [] },
  {
    icon: 'flatbuffers',
    mainLanguage: 'flatbuffers',
    displayName: 'Flatbuffers',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'fortran',
    mainLanguage: 'fortran',
    displayName: 'Fortran',
    detailedLanguages: [],
    aliases: ['fortran-modern', 'FortranFreeForm', 'FortranFixedForm', 'fortran_fixed-form'],
  },
  {
    icon: 'freemarker',
    mainLanguage: 'ftl',
    displayName: 'Ftl',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'fsharp', mainLanguage: 'fsharp', displayName: 'F#', detailedLanguages: [], aliases: [] },
  {
    icon: 'fthtml',
    mainLanguage: 'fthtml',
    displayName: 'Fthtml',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'galen',
    mainLanguage: 'galen',
    displayName: 'Galen',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'gamemaker',
    mainLanguage: 'gml-gms',
    displayName: 'Gml Gms',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'gamemaker81',
    mainLanguage: 'gml-gm81',
    displayName: 'Gml Gm81',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'gcode',
    mainLanguage: 'gcode',
    displayName: 'Gcode',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'gdscript',
    mainLanguage: 'gdscript',
    displayName: 'GDScript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'git',
    mainLanguage: 'git-commit',
    displayName: 'Git Commit Message',
    detailedLanguages: [],
    aliases: ['git-rebase', 'ignore', 'gitignore'],
  },
  {
    icon: 'gleam',
    mainLanguage: 'gleam',
    displayName: 'Gleam',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'glimmer',
    mainLanguage: 'glimmer-js',
    displayName: 'Glimmer Js',
    detailedLanguages: [],
    aliases: ['glimmer-ts'],
  },
  { icon: 'glsl', mainLanguage: 'glsl', displayName: 'GLSL', detailedLanguages: [], aliases: [] },
  {
    icon: 'glyphs',
    mainLanguage: 'glyphs',
    displayName: 'Glyphs',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'go', mainLanguage: 'go', displayName: 'Go', detailedLanguages: [], aliases: ['go.mod'] },
  {
    icon: 'go_work',
    mainLanguage: 'go.work',
    displayName: 'Go Workspace',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'goctl',
    mainLanguage: 'goctl',
    displayName: 'Goctl',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'gradle',
    mainLanguage: 'gradle-kotlin-dsl',
    displayName: 'Gradle Kotlin Dsl',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'grain',
    mainLanguage: 'grain',
    displayName: 'Grain',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'graphql_config',
    mainLanguage: 'graphql',
    displayName: 'GraphQL',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'grit', mainLanguage: 'grit', displayName: 'Grit', detailedLanguages: [], aliases: [] },
  {
    icon: 'groovy',
    mainLanguage: 'groovy',
    displayName: 'Groovy',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'haml', mainLanguage: 'haml', displayName: 'Haml', detailedLanguages: [], aliases: [] },
  {
    icon: 'handlebars',
    mainLanguage: 'handlebars',
    displayName: 'Handlebars',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'harbour',
    mainLanguage: 'harbour',
    displayName: 'Harbour',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'hashicorp',
    mainLanguage: 'hcl',
    displayName: 'HCL',
    detailedLanguages: [],
    aliases: ['packer', 'packervars'],
  },
  {
    icon: 'haskell',
    mainLanguage: 'haskell',
    displayName: 'Haskell',
    detailedLanguages: [],
    aliases: ['literate haskell'],
  },
  {
    icon: 'haxe',
    mainLanguage: 'haxe',
    displayName: 'Haxe',
    detailedLanguages: [],
    aliases: ['hxml', 'Haxe AST dump'],
  },
  { icon: 'helm', mainLanguage: 'helm', displayName: 'Helm', detailedLanguages: [], aliases: [] },
  {
    icon: 'hjson',
    mainLanguage: 'hjson',
    displayName: 'Hjson',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'hlsl', mainLanguage: 'hlsl', displayName: 'HLSL', detailedLanguages: [], aliases: [] },
  {
    icon: 'homeassistant',
    mainLanguage: 'home-assistant',
    displayName: 'Home Assistant',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'host', mainLanguage: 'hosts', displayName: 'Hosts', detailedLanguages: [], aliases: [] },
  { icon: 'html', mainLanguage: 'html', displayName: 'HTML', detailedLanguages: [], aliases: [] },
  { icon: 'http', mainLanguage: 'http', displayName: 'Http', detailedLanguages: [], aliases: [] },
  { icon: 'huff', mainLanguage: 'huff', displayName: 'Huff', detailedLanguages: [], aliases: [] },
  {
    icon: 'hunspell',
    mainLanguage: 'hunspell.aff',
    displayName: 'Hunspell Aff',
    detailedLanguages: [],
    aliases: ['hunspell.dic'],
  },
  { icon: 'hy', mainLanguage: 'hy', displayName: 'Hy', detailedLanguages: [], aliases: [] },
  { icon: 'hypr', mainLanguage: 'hypr', displayName: 'Hypr', detailedLanguages: [], aliases: [] },
  { icon: 'icl', mainLanguage: 'icl', displayName: 'Icl', detailedLanguages: [], aliases: [] },
  {
    icon: 'idris',
    mainLanguage: 'idris',
    displayName: 'Idris',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'imba', mainLanguage: 'imba', displayName: 'Imba', detailedLanguages: [], aliases: [] },
  { icon: 'informix', mainLanguage: '4GL', displayName: '4GL', detailedLanguages: [], aliases: [] },
  { icon: 'ini', mainLanguage: 'ini', displayName: 'INI', detailedLanguages: [], aliases: [] },
  { icon: 'ink', mainLanguage: 'ink', displayName: 'Ink', detailedLanguages: [], aliases: [] },
  {
    icon: 'innosetup',
    mainLanguage: 'innosetup',
    displayName: 'Innosetup',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'io', mainLanguage: 'io', displayName: 'Io', detailedLanguages: [], aliases: [] },
  {
    icon: 'janet',
    mainLanguage: 'janet',
    displayName: 'Janet',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'java', mainLanguage: 'java', displayName: 'Java', detailedLanguages: [], aliases: [] },
  {
    icon: 'jekyll',
    mainLanguage: 'jekyll',
    displayName: 'Jekyll',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'jenkins',
    mainLanguage: 'jenkins',
    displayName: 'Jenkins',
    detailedLanguages: [],
    aliases: ['declarative', 'jenkinsfile'],
  },
  {
    icon: 'jest_snapshot',
    mainLanguage: 'jest-snapshot',
    displayName: 'Jest Snapshot',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'jinja',
    mainLanguage: 'jinja',
    displayName: 'Jinja',
    detailedLanguages: [],
    aliases: [
      'jinja-java',
      'jinja-html',
      'jinja-xml',
      'jinja-css',
      'jinja-json',
      'jinja-md',
      'jinja-py',
      'jinja-rb',
      'jinja-js',
      'jinja-yaml',
      'jinja-toml',
      'jinja-latex',
      'jinja-lua',
      'jinja-properties',
      'jinja-shell',
      'jinja-dockerfile',
      'jinja-sql',
      'jinja-terraform',
      'jinja-nginx',
      'jinja-groovy',
      'jinja-systemd',
      'jinja-cpp',
      'jinja-cisco',
      'jinja-cy',
      'jinja-php',
      'jinja-rust',
    ],
  },
  {
    icon: 'js',
    mainLanguage: 'javascript',
    displayName: 'JavaScript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'json',
    mainLanguage: 'json',
    displayName: 'JSON',
    detailedLanguages: [],
    aliases: ['jsonc', 'jsonl'],
  },
  {
    icon: 'json5',
    mainLanguage: 'json5',
    displayName: 'JSON5',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'jsonnet',
    mainLanguage: 'jsonnet',
    displayName: 'Jsonnet',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'julia',
    mainLanguage: 'julia',
    displayName: 'Julia',
    detailedLanguages: [],
    aliases: ['juliamarkdown'],
  },
  { icon: 'just', mainLanguage: 'just', displayName: 'Just', detailedLanguages: [], aliases: [] },
  { icon: 'k', mainLanguage: 'k', displayName: 'K', detailedLanguages: [], aliases: [] },
  { icon: 'kivy', mainLanguage: 'kivy', displayName: 'Kivy', detailedLanguages: [], aliases: [] },
  {
    icon: 'kotlin',
    mainLanguage: 'kotlin',
    displayName: 'Kotlin',
    detailedLanguages: [],
    aliases: ['kotlinscript'],
  },
  { icon: 'lark', mainLanguage: 'lark', displayName: 'Lark', detailedLanguages: [], aliases: [] },
  {
    icon: 'latino',
    mainLanguage: 'latino',
    displayName: 'Latino',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'lean',
    mainLanguage: 'lean4',
    displayName: 'Lean4',
    detailedLanguages: [],
    aliases: ['lean4markdown'],
  },
  { icon: 'less', mainLanguage: 'less', displayName: 'Less', detailedLanguages: [], aliases: [] },
  { icon: 'lex', mainLanguage: 'lex', displayName: 'Lex', detailedLanguages: [], aliases: [] },
  {
    icon: 'lilypond',
    mainLanguage: 'lilypond',
    displayName: 'Lilypond',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'liquid',
    mainLanguage: 'liquid',
    displayName: 'Liquid',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'lisp',
    mainLanguage: 'lisp',
    displayName: 'Lisp',
    detailedLanguages: [],
    aliases: ['autolisp', 'autolispdcl'],
  },
  {
    icon: 'lolcode',
    mainLanguage: 'lolcode',
    displayName: 'Lolcode',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'lsl', mainLanguage: 'lsl', displayName: 'Lsl', detailedLanguages: [], aliases: [] },
  {
    icon: 'lua',
    mainLanguage: 'lua',
    displayName: 'Lua',
    detailedLanguages: [],
    aliases: ['glua'],
  },
  {
    icon: 'marko',
    mainLanguage: 'marko',
    displayName: 'Marko',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'matlab',
    mainLanguage: 'matlab',
    displayName: 'MATLAB',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'maxscript',
    mainLanguage: 'maxscript',
    displayName: 'Maxscript',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'mdx', mainLanguage: 'mdx', displayName: 'Mdx', detailedLanguages: [], aliases: [] },
  {
    icon: 'mediawiki',
    mainLanguage: 'mediawiki',
    displayName: 'MediaWiki',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'mermaid',
    mainLanguage: 'mermaid',
    displayName: 'Mermaid',
    detailedLanguages: [],
    aliases: [
      'mermaid.architecture',
      'mermaid.block',
      'mermaid.c4Diagram',
      'mermaid.classDiagram',
      'mermaid.erDiagram',
      'mermaid.flowchart',
      'mermaid.gantt',
      'mermaid.gitGraph',
      'mermaid.info',
      'mermaid.journey',
      'mermaid.kanban',
      'mermaid.mindmap',
      'mermaid.packet',
      'mermaid.pie',
      'mermaid.quadrantChart',
      'mermaid.radar',
      'mermaid.requirementDiagram',
      'mermaid.sankey',
      'mermaid.sequenceDiagram',
      'mermaid.stateDiagram',
      'mermaid.timeline',
      'mermaid.xychart',
      'mermaid.zenuml',
    ],
  },
  {
    icon: 'meson',
    mainLanguage: 'meson',
    displayName: 'Meson',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'metal',
    mainLanguage: 'metal',
    displayName: 'Metal',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'minecraft',
    mainLanguage: 'bc-mcfunction',
    displayName: 'Bc Mcfunction',
    detailedLanguages: [],
    aliases: [
      'bc-minecraft-language',
      'bc-minecraft-molang',
      'bc-minecraft-project',
      'mcdoc',
      'mcfunction',
      'mcmeta',
      'mcscript',
      'minecraft-lang',
      'options-txt',
      'snbt',
    ],
  },
  { icon: 'mjml', mainLanguage: 'mjml', displayName: 'Mjml', detailedLanguages: [], aliases: [] },
  {
    icon: 'mlang',
    mainLanguage: 'powerquery',
    displayName: 'Powerquery',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'mojo', mainLanguage: 'mojo', displayName: 'Mojo', detailedLanguages: [], aliases: [] },
  {
    icon: 'mojolicious',
    mainLanguage: 'mojolicious',
    displayName: 'Mojolicious',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'mongo',
    mainLanguage: 'mongo',
    displayName: 'Mongo',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'mson', mainLanguage: 'mson', displayName: 'Mson', detailedLanguages: [], aliases: [] },
  {
    icon: 'mustache',
    mainLanguage: 'mustache',
    displayName: 'Mustache',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'mvt', mainLanguage: 'mvt', displayName: 'Mvt', detailedLanguages: [], aliases: [] },
  {
    icon: 'mvtcss',
    mainLanguage: 'mvtcss',
    displayName: 'Mvtcss',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'mvtjs',
    mainLanguage: 'mvtjs',
    displayName: 'Mvtjs',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'nextflow',
    mainLanguage: 'nextflow',
    displayName: 'Nextflow',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'nginx',
    mainLanguage: 'nginx',
    displayName: 'Nginx',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'nim', mainLanguage: 'nim', displayName: 'Nim', detailedLanguages: [], aliases: [] },
  {
    icon: 'nimble',
    mainLanguage: 'nimble',
    displayName: 'Nimble',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'nix', mainLanguage: 'nix', displayName: 'Nix', detailedLanguages: [], aliases: [] },
  {
    icon: 'nsi',
    mainLanguage: 'nsis',
    displayName: 'Nsis',
    detailedLanguages: [],
    aliases: ['nfl', 'nsl', 'bridlensis'],
  },
  {
    icon: 'nunjucks',
    mainLanguage: 'nunjucks',
    displayName: 'Nunjucks',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'nushell',
    mainLanguage: 'nushell',
    displayName: 'Nushell',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'objectivec',
    mainLanguage: 'objective-c',
    displayName: 'Objective-C',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'objectivecpp',
    mainLanguage: 'objective-cpp',
    displayName: 'Objective-C++',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'ocaml',
    mainLanguage: 'ocaml',
    displayName: 'OCaml',
    detailedLanguages: [],
    aliases: ['ocamllex', 'menhir'],
  },
  {
    icon: 'ogone',
    mainLanguage: 'ogone',
    displayName: 'Ogone',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'openHAB',
    mainLanguage: 'openhab',
    displayName: 'Openhab',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'org', mainLanguage: 'org', displayName: 'Org', detailedLanguages: [], aliases: [] },
  { icon: 'patch', mainLanguage: 'diff', displayName: 'Diff', detailedLanguages: [], aliases: [] },
  {
    icon: 'pawn',
    mainLanguage: 'pawn',
    displayName: 'Pawn',
    detailedLanguages: [],
    aliases: ['amxxpawn'],
  },
  {
    icon: 'pddl',
    mainLanguage: 'pddl',
    displayName: 'Pddl',
    detailedLanguages: [],
    aliases: ['plan', 'happenings'],
  },
  { icon: 'perl', mainLanguage: 'perl', displayName: 'Perl', detailedLanguages: [], aliases: [] },
  {
    icon: 'pgsql',
    mainLanguage: 'pgsql',
    displayName: 'Pgsql',
    detailedLanguages: [],
    aliases: ['postgres'],
  },
  { icon: 'php', mainLanguage: 'php', displayName: 'PHP', detailedLanguages: [], aliases: [] },
  {
    icon: 'pine',
    mainLanguage: 'pine',
    displayName: 'Pine',
    detailedLanguages: [],
    aliases: ['pinescript'],
  },
  {
    icon: 'pip',
    mainLanguage: 'pip-requirements',
    displayName: 'Pip Requirements',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'platformio',
    mainLanguage: 'platformio-debug.disassembly',
    displayName: 'Platformio Debug Disassembly',
    detailedLanguages: [],
    aliases: ['platformio-debug.memoryview', 'platformio-debug.asm'],
  },
  {
    icon: 'plsql',
    mainLanguage: 'plsql',
    displayName: 'Plsql',
    detailedLanguages: [],
    aliases: ['oracle', 'oraclesql', 'oracle-sql'],
  },
  {
    icon: 'polymer',
    mainLanguage: 'polymer',
    displayName: 'Polymer',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'pony', mainLanguage: 'pony', displayName: 'Pony', detailedLanguages: [], aliases: [] },
  {
    icon: 'postcss',
    mainLanguage: 'postcss',
    displayName: 'PostCSS',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'postscript',
    mainLanguage: 'postscript',
    displayName: 'Postscript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'powershell',
    mainLanguage: 'powershell',
    displayName: 'PowerShell',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'prisma',
    mainLanguage: 'prisma',
    displayName: 'Prisma',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'processinglang',
    mainLanguage: 'pde',
    displayName: 'Pde',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'prolog',
    mainLanguage: 'prolog',
    displayName: 'Prolog',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'prometheus',
    mainLanguage: 'prometheus',
    displayName: 'Prometheus',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'protobuf',
    mainLanguage: 'proto3',
    displayName: 'Proto3',
    detailedLanguages: [],
    aliases: ['proto', 'prototext', 'textproto'],
  },
  { icon: 'pug', mainLanguage: 'jade', displayName: 'Pug', detailedLanguages: [], aliases: [] },
  {
    icon: 'puppet',
    mainLanguage: 'puppet',
    displayName: 'Puppet',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'purescript',
    mainLanguage: 'purescript',
    displayName: 'PureScript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'pyret',
    mainLanguage: 'pyret',
    displayName: 'Pyret',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'pyscript',
    mainLanguage: 'pyscript',
    displayName: 'Pyscript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'python',
    mainLanguage: 'python',
    displayName: 'Python',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'pythowo',
    mainLanguage: 'pythowo',
    displayName: 'Pythowo',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'qlikview',
    mainLanguage: 'qlik',
    displayName: 'Qlik',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'qml', mainLanguage: 'qml', displayName: 'QML', detailedLanguages: [], aliases: [] },
  {
    icon: 'qsharp',
    mainLanguage: 'qsharp',
    displayName: 'Qsharp',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'r', mainLanguage: 'r', displayName: 'R', detailedLanguages: [], aliases: [] },
  {
    icon: 'ra_syntax_tree',
    mainLanguage: 'ra_syntax_tree',
    displayName: 'Ra Syntax Tree',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'racket',
    mainLanguage: 'racket',
    displayName: 'Racket',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'raku',
    mainLanguage: 'raku',
    displayName: 'Raku',
    detailedLanguages: [],
    aliases: ['perl6'],
  },
  { icon: 'raml', mainLanguage: 'raml', displayName: 'Raml', detailedLanguages: [], aliases: [] },
  {
    icon: 'razor',
    mainLanguage: 'razor',
    displayName: 'Razor',
    detailedLanguages: [],
    aliases: ['aspnetcorerazor'],
  },
  {
    icon: 'reactjs',
    mainLanguage: 'javascriptreact',
    displayName: 'JavaScript React',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'reactts',
    mainLanguage: 'typescriptreact',
    displayName: 'TypeScript React',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'reason',
    mainLanguage: 'reason',
    displayName: 'Reason',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'red', mainLanguage: 'red', displayName: 'Red', detailedLanguages: [], aliases: [] },
  {
    icon: 'rescript',
    mainLanguage: 'rescript',
    displayName: 'ReScript',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'rexx', mainLanguage: 'rexx', displayName: 'Rexx', detailedLanguages: [], aliases: [] },
  { icon: 'riot', mainLanguage: 'riot', displayName: 'Riot', detailedLanguages: [], aliases: [] },
  {
    icon: 'ripple',
    mainLanguage: 'ripple',
    displayName: 'Ripple',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'rmd',
    mainLanguage: 'rmd',
    displayName: 'R Markdown',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'rnc', mainLanguage: 'rnc', displayName: 'Rnc', detailedLanguages: [], aliases: [] },
  {
    icon: 'robotframework',
    mainLanguage: 'robotframework',
    displayName: 'Robotframework',
    detailedLanguages: [],
    aliases: ['robot'],
  },
  {
    icon: 'robots',
    mainLanguage: 'robots-txt',
    displayName: 'Robots Txt',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'ruby', mainLanguage: 'ruby', displayName: 'Ruby', detailedLanguages: [], aliases: [] },
  { icon: 'rust', mainLanguage: 'rust', displayName: 'Rust', detailedLanguages: [], aliases: [] },
  {
    icon: 's-lang',
    mainLanguage: 's-lang',
    displayName: 'S Lang',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'san', mainLanguage: 'san', displayName: 'San', detailedLanguages: [], aliases: [] },
  { icon: 'sas', mainLanguage: 'SAS', displayName: 'SAS', detailedLanguages: [], aliases: [] },
  {
    icon: 'sass',
    mainLanguage: 'sass',
    displayName: 'Sass',
    detailedLanguages: ['scss'],
    aliases: ['sass.hover', 'scss'],
  },
  { icon: 'sbt', mainLanguage: 'sbt', displayName: 'Sbt', detailedLanguages: [], aliases: [] },
  {
    icon: 'scala',
    mainLanguage: 'scala',
    displayName: 'Scala',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'scilab',
    mainLanguage: 'scilab',
    displayName: 'Scilab',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'sdlang', mainLanguage: 'sdl', displayName: 'Sdl', detailedLanguages: [], aliases: [] },
  {
    icon: 'search_result',
    mainLanguage: 'search-result',
    displayName: 'Search Result',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'shaderlab',
    mainLanguage: 'shaderlab',
    displayName: 'Shaderlab',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'shell',
    mainLanguage: 'shellscript',
    displayName: 'Shell Script',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'silverstripe',
    mainLanguage: 'silverstripe',
    displayName: 'Silverstripe',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'sino', mainLanguage: 'sino', displayName: 'Sino', detailedLanguages: [], aliases: [] },
  {
    icon: 'skill',
    mainLanguage: 'skill',
    displayName: 'Skill',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'skipper',
    mainLanguage: 'eskip',
    displayName: 'Eskip',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'slang',
    mainLanguage: 'slang',
    displayName: 'Slang',
    detailedLanguages: [],
    aliases: ['slang-academic'],
  },
  { icon: 'slim', mainLanguage: 'slim', displayName: 'Slim', detailedLanguages: [], aliases: [] },
  {
    icon: 'slint',
    mainLanguage: 'slint',
    displayName: 'Slint',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'sln', mainLanguage: 'sln', displayName: 'Sln', detailedLanguages: [], aliases: [] },
  {
    icon: 'smarty',
    mainLanguage: 'smarty',
    displayName: 'Smarty',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'snakemake',
    mainLanguage: 'snakemake',
    displayName: 'Snakemake',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'snort',
    mainLanguage: 'snort',
    displayName: 'Snort',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'solidity',
    mainLanguage: 'solidity',
    displayName: 'Solidity',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'sparql',
    mainLanguage: 'sparql',
    displayName: 'Sparql',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'sqf', mainLanguage: 'sqf', displayName: 'Sqf', detailedLanguages: [], aliases: [] },
  { icon: 'sql', mainLanguage: 'sql', displayName: 'SQL', detailedLanguages: [], aliases: [] },
  {
    icon: 'sqlite',
    mainLanguage: 'sqlite',
    displayName: 'SQLite',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'squirrel',
    mainLanguage: 'squirrel',
    displayName: 'Squirrel',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'stan', mainLanguage: 'stan', displayName: 'Stan', detailedLanguages: [], aliases: [] },
  {
    icon: 'stata',
    mainLanguage: 'stata',
    displayName: 'Stata',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'stencil',
    mainLanguage: 'stencil',
    displayName: 'Stencil',
    detailedLanguages: [],
    aliases: ['stencil-html'],
  },
  {
    icon: 'stylable',
    mainLanguage: 'stylable',
    displayName: 'Stylable',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'styled',
    mainLanguage: 'source.css.styled',
    displayName: 'Source Css Styled',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'svelte',
    mainLanguage: 'svelte',
    displayName: 'Svelte',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'svg', mainLanguage: 'svg', displayName: 'Svg', detailedLanguages: [], aliases: [] },
  {
    icon: 'swagger',
    mainLanguage: 'swagger',
    displayName: 'Swagger',
    detailedLanguages: [],
    aliases: ['Swagger'],
  },
  {
    icon: 'swift',
    mainLanguage: 'swift',
    displayName: 'Swift',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'swig', mainLanguage: 'swig', displayName: 'Swig', detailedLanguages: [], aliases: [] },
  {
    icon: 'systemd',
    mainLanguage: 'systemd-conf',
    displayName: 'Systemd Conf',
    detailedLanguages: [],
    aliases: ['systemd-unit-file'],
  },
  {
    icon: 'systemverilog',
    mainLanguage: 'systemverilog',
    displayName: 'SystemVerilog',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'tailwind',
    mainLanguage: 'tailwindcss',
    displayName: 'Tailwindcss',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'tcl', mainLanguage: 'tcl', displayName: 'Tcl', detailedLanguages: [], aliases: [] },
  {
    icon: 'templ',
    mainLanguage: 'templ',
    displayName: 'Templ',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'tera', mainLanguage: 'tera', displayName: 'Tera', detailedLanguages: [], aliases: [] },
  {
    icon: 'terraform',
    mainLanguage: 'terraform',
    displayName: 'Terraform',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'tex',
    mainLanguage: 'tex',
    displayName: 'TeX',
    detailedLanguages: [],
    aliases: ['latex', 'doctex'],
  },
  {
    icon: 'textile',
    mainLanguage: 'textile',
    displayName: 'Textile',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'thinkscript',
    mainLanguage: 'thinkscript',
    displayName: 'Thinkscript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'tiltfile',
    mainLanguage: 'tiltfile',
    displayName: 'Tiltfile',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'toit', mainLanguage: 'toit', displayName: 'Toit', detailedLanguages: [], aliases: [] },
  { icon: 'toml', mainLanguage: 'toml', displayName: 'TOML', detailedLanguages: [], aliases: [] },
  { icon: 'toon', mainLanguage: 'toon', displayName: 'Toon', detailedLanguages: [], aliases: [] },
  { icon: 'ttcn', mainLanguage: 'ttcn', displayName: 'Ttcn', detailedLanguages: [], aliases: [] },
  { icon: 'tuc', mainLanguage: 'tuc', displayName: 'Tuc', detailedLanguages: [], aliases: [] },
  { icon: 'twig', mainLanguage: 'twig', displayName: 'Twig', detailedLanguages: [], aliases: [] },
  {
    icon: 'typescript',
    mainLanguage: 'typescript',
    displayName: 'TypeScript',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'typo3',
    mainLanguage: 'typoscript',
    displayName: 'Typoscript',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'uiua', mainLanguage: 'uiua', displayName: 'Uiua', detailedLanguages: [], aliases: [] },
  {
    icon: 'unison',
    mainLanguage: 'unison',
    displayName: 'Unison',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'vala', mainLanguage: 'vala', displayName: 'Vala', detailedLanguages: [], aliases: [] },
  {
    icon: 'vb',
    mainLanguage: 'vb',
    displayName: 'Visual Basic',
    detailedLanguages: [],
    aliases: ['vbscript'],
  },
  { icon: 'vba', mainLanguage: 'vba', displayName: 'VBA', detailedLanguages: [], aliases: [] },
  {
    icon: 'velocity',
    mainLanguage: 'velocity',
    displayName: 'Velocity',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'vento',
    mainLanguage: 'vento',
    displayName: 'Vento',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'verilog',
    mainLanguage: 'verilog',
    displayName: 'Verilog',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'vhdl', mainLanguage: 'vhdl', displayName: 'VHDL', detailedLanguages: [], aliases: [] },
  {
    icon: 'vim',
    mainLanguage: 'viml',
    displayName: 'Viml',
    detailedLanguages: [],
    aliases: ['vim-snippet'],
  },
  {
    icon: 'vitest',
    mainLanguage: 'vitest-snapshot',
    displayName: 'Vitest Snapshot',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'vlang', mainLanguage: 'v', displayName: 'V', detailedLanguages: [], aliases: [] },
  { icon: 'volt', mainLanguage: 'volt', displayName: 'Volt', detailedLanguages: [], aliases: [] },
  {
    icon: 'vroom',
    mainLanguage: 'vroom',
    displayName: 'Vroom',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'vue', mainLanguage: 'vue', displayName: 'Vue', detailedLanguages: [], aliases: [] },
  {
    icon: 'vyper',
    mainLanguage: 'vyper',
    displayName: 'Vyper',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'wasm',
    mainLanguage: 'wasm',
    displayName: 'WebAssembly',
    detailedLanguages: [],
    aliases: ['wat'],
  },
  { icon: 'wasp', mainLanguage: 'wasp', displayName: 'Wasp', detailedLanguages: [], aliases: [] },
  { icon: 'wesl', mainLanguage: 'wesl', displayName: 'Wesl', detailedLanguages: [], aliases: [] },
  {
    icon: 'wikitext',
    mainLanguage: 'wikitext',
    displayName: 'WikiText',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'wolfram',
    mainLanguage: 'wolfram',
    displayName: 'Wolfram',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'wurst',
    mainLanguage: 'wurst',
    displayName: 'Wurst',
    detailedLanguages: [],
    aliases: ['wurstlang'],
  },
  { icon: 'wxml', mainLanguage: 'wxml', displayName: 'Wxml', detailedLanguages: [], aliases: [] },
  {
    icon: 'xmake',
    mainLanguage: 'xmake',
    displayName: 'Xmake',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'xml', mainLanguage: 'xml', displayName: 'XML', detailedLanguages: [], aliases: [] },
  {
    icon: 'xquery',
    mainLanguage: 'xquery',
    displayName: 'Xquery',
    detailedLanguages: [],
    aliases: [],
  },
  {
    icon: 'xsl',
    mainLanguage: 'xsl',
    displayName: 'Xsl',
    detailedLanguages: [],
    aliases: ['xslt'],
  },
  { icon: 'yacc', mainLanguage: 'yacc', displayName: 'Yacc', detailedLanguages: [], aliases: [] },
  { icon: 'yaml', mainLanguage: 'yaml', displayName: 'YAML', detailedLanguages: [], aliases: [] },
  { icon: 'yang', mainLanguage: 'yang', displayName: 'Yang', detailedLanguages: [], aliases: [] },
  {
    icon: 'yarn',
    mainLanguage: 'yarnlock',
    displayName: 'Yarnlock',
    detailedLanguages: [],
    aliases: [],
  },
  { icon: 'zig', mainLanguage: 'zig', displayName: 'Zig', detailedLanguages: [], aliases: [] },
];

/** Friendly labels for language IDs a naive title-case would mangle. */
const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  ada: 'Ada',
  asciidoc: 'AsciiDoc',
  assembly: 'Assembly',
  astro: 'Astro',
  blade: 'Blade',
  c: 'C',
  cheader: 'C Header',
  clojure: 'Clojure',
  cmake: 'CMake',
  cobol: 'COBOL',
  cpp: 'C++',
  cppheader: 'C++ Header',
  crystal: 'Crystal',
  csharp: 'C#',
  css: 'CSS',
  d: 'D',
  dart: 'Dart',
  delphi: 'Delphi',
  dockerfile: 'Dockerfile',
  dotenv: 'Dotenv',
  elixir: 'Elixir',
  elm: 'Elm',
  erlang: 'Erlang',
  fortran: 'Fortran',
  fsharp: 'F#',
  gdscript: 'GDScript',
  'git-commit': 'Git Commit Message',
  'git-rebase': 'Git Rebase',
  gitignore: 'Git Ignore',
  gleam: 'Gleam',
  glsl: 'GLSL',
  go: 'Go',
  'go.work': 'Go Workspace',
  graphql: 'GraphQL',
  groovy: 'Groovy',
  haml: 'Haml',
  handlebars: 'Handlebars',
  haskell: 'Haskell',
  haxe: 'Haxe',
  hcl: 'HCL',
  hlsl: 'HLSL',
  hosts: 'Hosts',
  html: 'HTML',
  idris: 'Idris',
  ignore: 'Ignore File',
  ini: 'INI',
  jade: 'Pug',
  java: 'Java',
  javascript: 'JavaScript',
  javascriptreact: 'JavaScript React',
  jest_snapshot: 'Jest Snapshot',
  json: 'JSON',
  json5: 'JSON5',
  julia: 'Julia',
  kotlin: 'Kotlin',
  latex: 'LaTeX',
  less: 'Less',
  liquid: 'Liquid',
  lisp: 'Lisp',
  lua: 'Lua',
  matlab: 'MATLAB',
  mediawiki: 'MediaWiki',
  mustache: 'Mustache',
  nginx: 'Nginx',
  nim: 'Nim',
  'objective-c': 'Objective-C',
  'objective-cpp': 'Objective-C++',
  ocaml: 'OCaml',
  pascal: 'Pascal',
  perl: 'Perl',
  php: 'PHP',
  postcss: 'PostCSS',
  powershell: 'PowerShell',
  prolog: 'Prolog',
  protobuf: 'Protocol Buffers',
  pug: 'Pug',
  purescript: 'PureScript',
  python: 'Python',
  qml: 'QML',
  quarto: 'Quarto',
  r: 'R',
  racket: 'Racket',
  raku: 'Raku',
  razor: 'Razor',
  reason: 'Reason',
  rescript: 'ReScript',
  rexx: 'Rexx',
  rmd: 'R Markdown',
  ruby: 'Ruby',
  rust: 'Rust',
  sas: 'SAS',
  sass: 'Sass',
  scala: 'Scala',
  scss: 'SCSS',
  shellscript: 'Shell Script',
  slim: 'Slim',
  smarty: 'Smarty',
  solidity: 'Solidity',
  sql: 'SQL',
  sqlite: 'SQLite',
  stata: 'Stata',
  svelte: 'Svelte',
  swift: 'Swift',
  systemverilog: 'SystemVerilog',
  tcl: 'Tcl',
  terraform: 'Terraform',
  tex: 'TeX',
  textile: 'Textile',
  toml: 'TOML',
  toon: 'Toon',
  twig: 'Twig',
  typescript: 'TypeScript',
  typescriptreact: 'TypeScript React',
  v: 'V',
  vala: 'Vala',
  vb: 'Visual Basic',
  vba: 'VBA',
  vbscript: 'VBScript',
  verilog: 'Verilog',
  vhdl: 'VHDL',
  vlang: 'V',
  vue: 'Vue',
  wasm: 'WebAssembly',
  wikitext: 'WikiText',
  wolfram: 'Wolfram',
  xml: 'XML',
  yaml: 'YAML',
  zig: 'Zig',
};
/**
 * Returns a human-readable label for a language or icon key.
 *
 * @param key A VS Code language ID or registry icon key.
 */
export function formatLanguageLabel(key: string): string {
  const known = LANGUAGE_LABELS[key];
  if (known) {
    return known;
  }
  const cleaned = key
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

/** Lazily built lookup: main language ID to group. */
let mainLanguageIndex: Map<string, SupportedLanguage> | undefined;

/** Lazily built lookup: detailed variant to its parent group. */
let detailedLanguageIndex: Map<string, SupportedLanguage> | undefined;

/** Lazily built lookup: alias language ID to its parent group. */
let aliasIndex: Map<string, SupportedLanguage> | undefined;

/** Returns the map of main language identifiers to their groups. */
export function getMainLanguageIndex(): Map<string, SupportedLanguage> {
  if (!mainLanguageIndex) {
    mainLanguageIndex = new Map();
    for (const entry of SUPPORTED_LANGUAGES) {
      mainLanguageIndex.set(entry.mainLanguage, entry);
    }
  }
  return mainLanguageIndex;
}

/** Returns the map of detailed language identifiers to their parent groups. */
export function getDetailedLanguageIndex(): Map<string, SupportedLanguage> {
  if (!detailedLanguageIndex) {
    detailedLanguageIndex = new Map();
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const detail of entry.detailedLanguages) {
        detailedLanguageIndex.set(detail, entry);
      }
    }
  }
  return detailedLanguageIndex;
}

/** Returns the map of alias language identifiers to their parent groups. */
export function getAliasIndex(): Map<string, SupportedLanguage> {
  if (!aliasIndex) {
    aliasIndex = new Map();
    for (const entry of SUPPORTED_LANGUAGES) {
      for (const alias of entry.aliases) {
        aliasIndex.set(alias, entry);
      }
    }
  }
  return aliasIndex;
}

/**
 * Resolves a VS Code language ID to its registry group, honoring the given
 * detail mode.
 *
 * In `detailed` mode an exact variant match wins, then a primary ID, then an
 * alias. In `main` mode variants are ignored so the parent icon is used.
 *
 * @param languageId The VS Code language ID (e.g. `typescript`, `scss`).
 * @param mode Which level of matching to attempt first.
 * @returns The matching group, or `undefined` if the language is unregistered.
 */
export function resolveLanguage(
  languageId: string,
  mode: 'main' | 'detailed',
): SupportedLanguage | undefined {
  if (mode === 'detailed') {
    const detailed = getDetailedLanguageIndex().get(languageId);
    if (detailed) {
      return detailed;
    }
  }
  return getMainLanguageIndex().get(languageId) ?? getAliasIndex().get(languageId);
}

/**
 * Returns the icon key that should be displayed for a language ID, honoring
 * the user enabled-languages filter and detail mode.
 *
 * Resolution order:
 * 1. In `detailed` mode, a variant's own icon when that variant is enabled.
 * 2. The parent group's icon when it is enabled.
 * 3. {@link FALLBACK_ICON_KEY} otherwise.
 *
 * @param languageId The VS Code language ID.
 * @param mode The user detail mode.
 * @param enabledIconKeys Icon keys the user has permitted. Empty means all.
 * @returns The icon key to display.
 */
export function resolveIconKey(
  languageId: string,
  mode: 'main' | 'detailed',
  enabledIconKeys: readonly string[],
): string {
  if (isNothingEnabled(enabledIconKeys)) {
    return FALLBACK_ICON_KEY;
  }

  const allowAll = enabledIconKeys.length === 0;
  const isAllowed = (key: string): boolean => allowAll || enabledIconKeys.includes(key);

  const group = resolveLanguage(languageId, mode);
  if (!group) {
    return FALLBACK_ICON_KEY;
  }

  if (mode === 'detailed' && isDetailedLanguage(languageId) && isAllowed(languageId)) {
    return languageId;
  }

  return isAllowed(group.icon) ? group.icon : FALLBACK_ICON_KEY;
}

/** Returns `true` when the ID is a toggleable detailed variant. */
export function isDetailedLanguage(languageId: string): boolean {
  return getDetailedLanguageIndex().has(languageId);
}

/** Returns every primary icon key in the registry. */
export function getAllIconKeys(): string[] {
  return SUPPORTED_LANGUAGES.map((entry) => entry.icon);
}

/**
 * Returns every key the user can toggle: primary icons plus detailed
 * variants. This is the set `languages.enabled` may contain.
 */
export function getAllPermissionKeys(): string[] {
  const keys: string[] = [];
  for (const entry of SUPPORTED_LANGUAGES) {
    keys.push(entry.icon);
    keys.push(...entry.detailedLanguages);
  }
  return keys;
}

/** Returns `true` when `key` is a value `languages.enabled` may hold. */
export function isPermissionKey(key: string): boolean {
  return getAllPermissionKeys().includes(key);
}

/** Returns the registry sorted by `icon`. Used by the Webview picker. */
export function getGroupedLanguages(): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES;
}
