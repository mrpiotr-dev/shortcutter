/**
 * Line coverage of all published packages, in the shields.io endpoint format, for the README badge:
 * https://img.shields.io/endpoint?url=https://www.shortcutter.dev/badges/coverage.json
 */
import type { APIRoute } from 'astro';
import { coverageOrFail, formatPercent } from '../../data/coverage';

function color(percent: number): string {
  if (percent >= 95) return 'brightgreen';
  if (percent >= 90) return 'green';
  if (percent >= 80) return 'yellow';
  return 'red';
}

export const GET: APIRoute = () => {
  const coverage = coverageOrFail();

  return Response.json({
    schemaVersion: 1,
    label: 'coverage',
    message: coverage ? formatPercent(coverage.percent) : 'unknown',
    color: coverage ? color(coverage.percent) : 'lightgrey',
  });
};
