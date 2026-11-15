import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../scripts/pack';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  pack: libraryPack(pkg),
  // Compiles the .svelte test fixture only; the published adapter is plain TypeScript.
  plugins: [svelte()],
  // Svelte's default build is for SSR; tests need the client one.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'happy-dom',
    server: { deps: { inline: [/svelte/] } },
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
});
