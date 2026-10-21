/**
 * VS Code integration test bootstrap.
 *
 * Downloads a pinned VS Code build, installs the extension into it, and
 * runs the Mocha suite from `suite/index.ts`. Invoked by `npm test`.
 */

import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  // Compiled to `out/test/runTest.js`; the extension lives two levels up.
  const extensionDevelopmentPath = path.resolve(__dirname, '../..');
  const extensionTestsPath = path.resolve(__dirname, './suite/index');

  try {
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', '--disable-gpu'],
    });
  } catch (err) {
    console.error('Integration tests failed:', err);
    process.exit(1);
  }
}

void main();
