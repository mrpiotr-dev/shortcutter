/** Size of the core browser build, minified and gzipped, measured at build time. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const file = resolve(process.cwd(), '../../packages/core/dist/index.iife.js');

/** `2.6 kB`, or `undefined` if the core package has not been built (only allowed in `astro dev`). */
export function coreSize(): string | undefined {
  if (!existsSync(file)) {
    if (import.meta.env.DEV) return undefined;
    throw new Error(
      'packages/core/dist/index.iife.js missing: build the core package before the docs.',
    );
  }

  const bytes = gzipSync(readFileSync(file), { level: 9 }).length;

  return `${(bytes / 1000).toFixed(1)} kB`;
}
