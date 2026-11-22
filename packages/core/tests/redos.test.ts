/**
 * Denial-of-service regressions: shortcut strings can come from user data (saved keymap
 * overrides), so no input may make matching take long. Each case took seconds to hours before the
 * wildcard matcher stopped using regexes built from patterns and backtracking over assignments.
 */
import { describe, expect, it } from 'vite-plus/test';
import { createShortcutter } from '../src/index';
import { parseShortcut, wildcardMatcher } from '../src/keys';
import { createKeymap } from '../src/keymap';
import { createSequences } from '../src/sequences';

/** Generous: the fixed code needs well under a millisecond, the vulnerable one seconds or more. */
const BUDGET_MS = 250;

function fast(run: () => unknown): void {
  const start = performance.now();

  try {
    run();
  } catch {
    // Rejecting the input is fine; only the time matters here.
  }
  expect(performance.now() - start).toBeLessThan(BUDGET_MS);
}

describe('no catastrophic backtracking', () => {
  it('matches many stars in one key against long names (was a regex, O(n^stars))', () => {
    fast(() => wildcardMatcher(['a*a*a*a*a*a*b'])(['a'.repeat(10_000)]));
    fast(() => wildcardMatcher(['a*'.repeat(50) + 'b'])(['a'.repeat(200)]));
  });

  it('assigns many wildcards to keys (was backtracking, O(n!))', () => {
    const keys = Array.from({ length: 16 }, (_, i) => `x${i}`);

    fast(() => wildcardMatcher([...Array(15).fill('x*'), 'y*'])(keys));
  });

  it('checks conflicts of hostile saved overrides', () => {
    const shortcutter = createShortcutter({ target: new EventTarget(), mac: false });
    const keymap = createKeymap(
      shortcutter,
      { a: { keys: [], run: () => {} }, b: { keys: [], run: () => {} } },
      { overrides: { a: ['a'.repeat(5_000)], b: ['a*'.repeat(30) + 'b'] } },
    );

    fast(() => keymap.conflicts('a*'.repeat(30) + 'c'));
  });

  it('parses huge shortcut and sequence strings in linear time', () => {
    const shortcutter = createShortcutter({ target: new EventTarget(), mac: false });

    fast(() => parseShortcut('a'.repeat(100_000), false));
    fast(() => parseShortcut(Array(20_000).fill('a').join('+'), false));
    fast(() => parseShortcut(' + '.repeat(30_000) + 'a', false));
    fast(() => createSequences(shortcutter).listen(' \t'.repeat(50_000) + 'a', () => {}));
  });
});
