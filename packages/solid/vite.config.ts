import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  pack: libraryPack(pkg),
  // Solid's default build is for SSR, where effects never run; tests need the client one.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'happy-dom',
    server: { deps: { inline: [/solid-js/] } },
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
});
