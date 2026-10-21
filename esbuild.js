/**
 * esbuild bundler configuration for That VSCode RPC.
 *
 * Two build passes:
 * 1. `src/extension.ts` → `dist/extension.js` (Node, CJS, `vscode` external).
 * 2. `src/webview/html/languagePicker.js` → `dist/webview/languagePicker.js`
 *    (browser, IIFE, no externals).
 *
 * Static Webview assets (HTML, CSS) are copied verbatim into `dist/webview/`.
 *
 * Flags:
 *   --production  Minify and drop source maps. Used by `vscode:prepublish`.
 *   --watch       Rebuild on file change.
 *   --webview     Build only the Webview pass (fast iteration on the picker).
 */

const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const webviewOnly = process.argv.includes('--webview');

/** @type {import('esbuild').BuildOptions} */
const COMMON = {
  bundle: true,
  sourcemap: !production,
  minify: production,
  legalComments: 'none',
  logLevel: 'info',
};

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
  ...COMMON,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode'],
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
  ...COMMON,
  entryPoints: ['src/webview/html/languagePicker.js'],
  outfile: 'dist/webview/languagePicker.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  resolveExtensions: ['.js'],
};

const STATIC_ASSETS = [
  ['src/webview/html/languagePicker.html', 'dist/webview/languagePicker.html'],
  ['src/webview/html/languagePicker.css', 'dist/webview/languagePicker.css'],
];

/**
 * Copies each static asset to its destination, creating parent directories
 * as needed. Runs in parallel.
 */
async function copyStaticAssets() {
  await Promise.all(
    STATIC_ASSETS.map(async ([source, destination]) => {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
    }),
  );
}

/** Runs both build passes and the asset copies once. */
async function buildOnce() {
  const tasks = [copyStaticAssets(), esbuild.build(webviewConfig)];
  if (!webviewOnly) {
    tasks.push(esbuild.build(extensionConfig));
  }
  await Promise.all(tasks);
  console.log('[esbuild] build finished');
}

/**
 * Sets up watch mode for the selected pass(es). Logs a completion line after
 * each rebuild so VS Code's `problemMatcher` in `tasks.json` can detect the
 * end of a build cycle.
 */
async function buildWatch() {
  // Ensure the destinations exist before the file watchers start copying.
  await copyStaticAssets();

  if (!webviewOnly) {
    const extensionCtx = await esbuild.context({
      ...extensionConfig,
      plugins: [rebuildLogger()],
    });
    await extensionCtx.watch();
    console.log('[esbuild] watching extension for changes...');
  }

  const webviewCtx = await esbuild.context({
    ...webviewConfig,
    plugins: [rebuildLogger()],
  });
  await webviewCtx.watch();
  console.log('[esbuild] watching webview for changes...');

  for (const [source, destination] of STATIC_ASSETS) {
    fs.watch(source, async () => {
      try {
        await fs.copyFile(source, destination);
        console.log(`[esbuild] copied ${source} → ${destination}`);
        console.log('[esbuild] build finished');
      } catch (err) {
        console.error(`[esbuild] failed to copy ${source}`, err);
      }
    });
  }
}

/** Reports the end of every rebuild so tasks.json can sync on it. */
function rebuildLogger() {
  return {
    name: 'rebuild-logger',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length === 0) {
          console.log('[esbuild] build finished');
        }
      });
    },
  };
}

async function main() {
  if (watch) {
    await buildWatch();
  } else {
    await buildOnce();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
