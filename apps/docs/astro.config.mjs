// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// Telemetry is disabled with ASTRO_TELEMETRY_DISABLED=1 in the package scripts (Astro has no config option).
export default defineConfig({
  // Canonical host: the apex domain redirects here (see README.md).
  site: 'https://www.shortcutter.dev/',
  // Every URL ends with a slash, so canonicals, sitemap and links agree. Cloudflare enforces it too
  // (`html_handling: "force-trailing-slash"` in wrangler.jsonc).
  trailingSlash: 'always',
  build: { format: 'directory' },
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
      expressiveCode: { styleOverrides: { borderRadius: '0', borderWidth: '2px' } },
      customCss: [
        '@fontsource-variable/jost',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/theme.css',
      ],
      sidebar: [{ label: 'Start here', items: [{ slug: 'docs' }] }],
    }),
  ],
});
