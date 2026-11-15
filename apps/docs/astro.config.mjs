// @ts-check
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import { bauhausInk, bauhausPaper } from './src/code-themes.mjs';

// Telemetry is disabled with ASTRO_TELEMETRY_DISABLED=1 in the package scripts (Astro has no config option).
export default defineConfig({
  // Canonical host: the apex domain redirects here (see README.md).
  site: 'https://www.shortcutter.dev/',
  // Every URL ends with a slash, so canonicals, sitemap and links agree. Cloudflare enforces it too
  // (`html_handling: "force-trailing-slash"` in wrangler.jsonc).
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    plugins: [
      {
        // With React and Vue together, @vitejs/plugin-vue compiles <script setup> with the shared oxc
        // options, including React's refresh transform but not its file filter. useShortcut() looks
        // like a hook, so dev SSR of Counter.vue failed with "$RefreshSig$ is not defined". The React
        // demo reloads fully on edits instead of fast-refreshing; production builds are unaffected.
        name: 'shortcutter:no-react-refresh',
        enforce: 'post',
        config: () => ({ oxc: { jsx: { refresh: false } } }),
      },
    ],
  },
  integrations: [
    starlight({
      title: 'shortcutter',
      description:
        'Tiny, dependency-free keyboard shortcuts with contexts and key phases. React, Vue, Svelte and Solid adapters.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mrpiotr-dev/shortcutter' },
      ],
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      // Bauhaus: flat, sharp code frames.
      expressiveCode: {
        themes: [bauhausInk, bauhausPaper],
        styleOverrides: {
          borderRadius: '0',
          borderWidth: '2px',
          borderColor: 'var(--sl-color-gray-5)',
          codeFontFamily: 'var(--sl-font-mono)',
          uiFontFamily: 'var(--sl-font)',
          // Flat, no depth (Bauhaus).
          frames: { frameBoxShadowCssValue: 'none' },
        },
      },
      customCss: [
        '@fontsource-variable/jost',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/theme.css',
      ],
      sidebar: [
        { label: 'Start here', items: [{ slug: 'docs' }] },
        {
          label: 'Guides',
          items: [
            { slug: 'docs/guides/games' },
            { slug: 'docs/guides/apps' },
            { slug: 'docs/guides/websites' },
          ],
        },
      ],
    }),
    // Live adapter demos on the landing page. React and Solid both use JSX, so each owns a folder.
    react({ include: [/\/demos\/react\//] }),
    solid({ include: [/\/demos\/solid\//] }),
    vue(),
    svelte(),
  ],
});
