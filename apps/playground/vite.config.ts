import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    // Work against library sources directly: no rebuild needed, HMR on every change.
    alias: {
      shortcutter: fileURLToPath(
        new URL('../../packages/shortcutter/src/index.ts', import.meta.url),
      ),
    },
  },
});
