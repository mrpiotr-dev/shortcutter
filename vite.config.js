import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'bundle/umd',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Shortcutter',
      fileName: 'shortcutter',
      formats: ['iife', 'umd'],
    },
  },
})