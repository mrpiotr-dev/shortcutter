import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
    // MDX: the formatter collapses code fences inside JSX components, which breaks them.
    ignorePatterns: ['**/dist/**', 'pnpm-lock.yaml', '**/*.mdx'],
  },
  lint: {
    ignorePatterns: ['**/dist/**'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
