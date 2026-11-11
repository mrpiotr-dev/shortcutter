import { defineConfig } from 'vite-plus';
import type { PackUserConfig } from 'vite-plus/pack';
import pkg from './package.json' with { type: 'json' };

const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License | ${pkg.homepage} */`;

const shared: PackUserConfig = {
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2020',
  sourcemap: true,
  banner,
  outputOptions: { comments: { legal: false } },
};

export default defineConfig({
  pack: [
    {
      ...shared,
      // esm + cjs keep parity with 0.2.0 (`module` / `main` fields).
      format: ['esm', 'cjs'],
      dts: { generator: 'tsgo' },
      exports: true,
      publint: true,
      attw: { profile: 'node16' },
    },
    {
      ...shared,
      // Minified <script>-tag build for CDNs (replaces the old UMD bundle): window.Shortcutter
      format: ['iife'],
      globalName: 'Shortcutter',
      minify: true,
    },
  ],
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
});
