/**
 * Discovers and runs the Mocha suite inside the VS Code test host.
 *
 * Files matching `*.test.js` under `out/test/suite/` are loaded. Tests are
 * written in TypeScript under `src/test/suite/` and compiled to `out/` by the
 * build task.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import Mocha from 'mocha';

/**
 * Runs the test suite. Called by `runTest.ts` from inside the VS Code host.
 *
 * @returns A promise that resolves when the suite finishes, or rejects on
 * any failing test.
 */
export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 10_000 });
  const testsRoot = path.resolve(__dirname);

  const files = collectTestFiles(testsRoot);
  for (const file of files) {
    mocha.addFile(file);
  }

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}

/** Recursively collects compiled test files, sorted for deterministic runs. */
function collectTestFiles(root: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTestFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(full);
    }
  }
  return results.sort();
}
