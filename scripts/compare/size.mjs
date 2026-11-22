/**
 * Bundle size of every compared library: an entry re-exporting everything is bundled with Vite+
 * (Rolldown) in library mode, fully minified, and gzipped at level 9. React stays external.
 * shortcutter is measured from this repository's builds (run `pnpm run build` first).
 *
 * Usage: node scripts/compare/install.mjs <dir> && node scripts/compare/size.mjs <dir>
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { LIBRARIES } from './libraries.mjs';

const dir = resolve(process.argv[2] ?? '');

if (!process.argv[2]) throw new Error('Usage: node scripts/compare/size.mjs <dir>');

const repo = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(join(repo, 'packages/core/package.json'));
const vitePlus = await import(pathToFileURL(require.resolve('vite-plus')).href);
const build = vitePlus.build ?? vitePlus.default.build;
const dist = (file) => join(repo, 'packages/core/dist', file);
const version = JSON.parse(readFileSync(join(repo, 'packages/core/package.json'), 'utf8')).version;

/** name → entry code. CommonJS packages and hotkeys-js only have a default export. */
const cases = {
  tinykeys: `export * from 'tinykeys';`,
  keymaster: `export { default } from 'keymaster';`,
  '@github/hotkey': `export * from '@github/hotkey';`,
  mousetrap: `export { default } from 'mousetrap';`,
  'react-hotkeys-hook (React only)': `export * from 'react-hotkeys-hook';`,
  'hotkeys-js': `export { default } from 'hotkeys-js';`,
  '@tanstack/hotkeys': `export * from '@tanstack/hotkeys';`,
  shortcutter: `export * from '${dist('index.js')}';`,
  'shortcutter + sequences': `export * from '${dist('index.js')}'; export * from '${dist('sequences.js')}';`,
  'shortcutter + format': `export * from '${dist('index.js')}'; export * from '${dist('format.js')}';`,
  'shortcutter + record': `export * from '${dist('index.js')}'; export * from '${dist('record.js')}';`,
  'shortcutter + keymap': `export * from '${dist('index.js')}'; export * from '${dist('keymap.js')}';`,
  'shortcutter + keymap + record': `export * from '${dist('index.js')}'; export * from '${dist('keymap.js')}'; export * from '${dist('record.js')}';`,
  'shortcutter + @shortcutter/react, useShortcut only': `export { useShortcut } from '${join(repo, 'packages/react/dist/index.js')}';`,
  'shortcutter + @shortcutter/react, all exports': `export * from '${join(repo, 'packages/react/dist/index.js')}';`,
};

const versions = { ...LIBRARIES };
const rows = [];

mkdirSync(join(dir, 'entries'), { recursive: true });

for (const [name, code] of Object.entries(cases)) {
  const id = name.replace(/[^a-z0-9]+/gi, '-');
  const entry = join(dir, 'entries', `${id}.js`);
  const outDir = join(dir, 'size', id);

  writeFileSync(entry, code);
  await build({
    root: dir,
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: [
        { find: /^shortcutter\/(.+)$/, replacement: dist('$1.js') },
        { find: /^shortcutter$/, replacement: dist('index.js') },
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      lib: { entry, formats: ['es'], fileName: () => 'bundle.js' },
      rolldownOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        // Library mode keeps whitespace in ES output; minify it fully, like an app bundle would.
        output: { minify: true },
      },
    },
  });

  const bytes = readFileSync(join(outDir, 'bundle.js'));
  const library = name.split(' ')[0];

  rows.push({
    name,
    version: versions[library] ?? version,
    minified: bytes.length,
    gzipped: gzipSync(bytes, { level: 9 }).length,
  });
}

rows.sort((a, b) => a.gzipped - b.gzipped);
console.log('| Library | Version | Minified | Gzipped |\n| --- | --- | --- | --- |');
for (const row of rows) {
  console.log(
    `| ${row.name} | ${row.version} | ${(row.minified / 1000).toFixed(1)} kB | **${(row.gzipped / 1000).toFixed(2)} kB** |`,
  );
}
