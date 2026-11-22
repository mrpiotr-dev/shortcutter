/**
 * Installs the compared libraries into `dir` (outside the repository), without running any
 * install scripts. Usage: node scripts/compare/install.mjs <dir>
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LIBRARIES, PEERS } from './libraries.mjs';

const dir = resolve(process.argv[2] ?? '');

if (!process.argv[2]) throw new Error('Usage: node scripts/compare/install.mjs <dir>');

mkdirSync(dir, { recursive: true });
writeFileSync(
  join(dir, 'package.json'),
  JSON.stringify(
    { name: 'shortcutter-compare', private: true, dependencies: { ...LIBRARIES, ...PEERS } },
    null,
    2,
  ),
);
// A standalone project: --ignore-workspace keeps it out of the repository's workspace.
execFileSync(
  'pnpm',
  ['install', '--ignore-scripts', '--ignore-workspace', '--no-frozen-lockfile'],
  {
    cwd: dir,
    stdio: 'inherit',
  },
);
