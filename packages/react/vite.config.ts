import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  pack: libraryPack(pkg),
  test: {
    environment: 'happy-dom',
    // json-summary feeds the coverage badge on shortcutter.dev (apps/docs/src/pages/badges/coverage.json.ts).
    coverage: { provider: 'v8', include: ['src/**/*.ts'], reporter: ['text', 'json-summary'] },
  },
});
