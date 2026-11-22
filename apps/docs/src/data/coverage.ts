/**
 * Line coverage of all published packages, read at build time from the `coverage-summary.json`
 * files that each package's `test:coverage` writes (the docs `build` script runs them first).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type Summary = { total: { lines: { total: number; covered: number } } };

const packagesDir = resolve(process.cwd(), '../../packages');

/** Covered and total lines across packages, or `undefined` if a summary is missing. */
export function readCoverage(): { covered: number; total: number; percent: number } | undefined {
  let covered = 0;
  let total = 0;

  for (const name of readdirSync(packagesDir)) {
    const file = join(packagesDir, name, 'coverage', 'coverage-summary.json');

    if (!existsSync(file)) return undefined;

    const { lines } = (JSON.parse(readFileSync(file, 'utf8')) as Summary).total;

    covered += lines.covered;
    total += lines.total;
  }

  return total > 0 ? { covered, total, percent: (covered / total) * 100 } : undefined;
}

/** `97.3%`: rounded down, so the badge never overstates. */
export function formatPercent(percent: number): string {
  return `${Math.floor(percent * 10) / 10}%`;
}

/** Coverage for the build, failing it when a summary is missing (except in `astro dev`). */
export function coverageOrFail(): ReturnType<typeof readCoverage> {
  const result = readCoverage();

  if (!result && !import.meta.env.DEV) {
    throw new Error(
      'Coverage summaries missing: run `test:coverage` in every package before building the docs.',
    );
  }
  return result;
}
