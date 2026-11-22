/**
 * The libraries on the comparison page (apps/docs/src/content/docs/docs/comparison.mdx), pinned.
 * Bump a version here and run `node scripts/compare/size.mjs <dir>` to re-measure.
 * Versions newer than a day are skipped on purpose (pnpm's minimum release age).
 */
export const LIBRARIES = {
  tinykeys: '4.0.1',
  keymaster: '1.6.2',
  '@github/hotkey': '3.1.4',
  mousetrap: '1.6.5',
  'react-hotkeys-hook': '5.4.0',
  'hotkeys-js': '4.1.3',
  '@tanstack/hotkeys': '0.33.0',
};

/**
 * Also installed: React for the React-only library (kept external in size bundles), and the DOM
 * the behaviour tests run in (the same happy-dom as the repository's tests).
 */
export const PEERS = { react: '19.3.1', 'react-dom': '19.3.1', 'happy-dom': '21.0.4' };
