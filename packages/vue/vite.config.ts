import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  pack: libraryPack(pkg),
  test: {
    environment: 'happy-dom',
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
});
