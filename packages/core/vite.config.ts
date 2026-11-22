import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

const pack = libraryPack(pkg);

export default defineConfig({
  pack: [
    // sequences, format, record and keymap are optional entries: apps that do not import them do
    // not ship them, and the core <script> build stays small.
    {
      ...pack,
      entry: [
        'src/index.ts',
        'src/sequences.ts',
        'src/format.ts',
        'src/record.ts',
        'src/keymap.ts',
      ],
    },
    {
      ...pack,
      // Minified <script>-tag build for CDNs: window.Shortcutter
      format: ['iife'],
      globalName: 'Shortcutter',
      minify: true,
      dts: false,
      exports: false,
      publint: false,
      attw: false,
    },
    {
      ...pack,
      // <script>-tag build of the optional sequences entry: window.ShortcutterSequences
      entry: ['src/sequences.ts'],
      format: ['iife'],
      globalName: 'ShortcutterSequences',
      minify: true,
      dts: false,
      exports: false,
      publint: false,
      attw: false,
    },
    {
      ...pack,
      // <script>-tag build of the optional format entry: window.ShortcutterFormat
      entry: ['src/format.ts'],
      format: ['iife'],
      globalName: 'ShortcutterFormat',
      minify: true,
      dts: false,
      exports: false,
      publint: false,
      attw: false,
    },
    {
      ...pack,
      // <script>-tag build of the optional record entry: window.ShortcutterRecord
      entry: ['src/record.ts'],
      format: ['iife'],
      globalName: 'ShortcutterRecord',
      minify: true,
      dts: false,
      exports: false,
      publint: false,
      attw: false,
    },
    {
      ...pack,
      // <script>-tag build of the optional keymap entry: window.ShortcutterKeymap
      entry: ['src/keymap.ts'],
      format: ['iife'],
      globalName: 'ShortcutterKeymap',
      minify: true,
      dts: false,
      exports: false,
      publint: false,
      attw: false,
    },
  ],
  test: {
    environment: 'happy-dom',
    // json-summary feeds the coverage badge on shortcutter.dev (apps/docs/src/pages/badges/coverage.json.ts).
    coverage: { provider: 'v8', include: ['src/**/*.ts'], reporter: ['text', 'json-summary'] },
  },
});
