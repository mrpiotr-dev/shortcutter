import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

const pack = libraryPack(pkg);

export default defineConfig({
  pack: [
    pack,
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
  ],
  test: {
    environment: 'happy-dom',
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
});
