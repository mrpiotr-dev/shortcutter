// @ts-check
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import starlightChangelogs, { makeChangelogsSidebarLinks } from 'starlight-changelogs';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightTypeDoc, {
  createStarlightTypeDocPlugin,
  typeDocSidebarGroup,
} from 'starlight-typedoc';
import { bauhausInk, bauhausPaper } from './src/code-themes.mjs';

const ADAPTERS = [
  { name: 'react', label: 'React' },
  { name: 'vue', label: 'Vue' },
  { name: 'svelte', label: 'Svelte' },
  { name: 'solid', label: 'Solid' },
];

// One API reference per adapter, next to its framework guide: /docs/frameworks/react/api/, …
const adapterApis = ADAPTERS.map(({ name, label }) => {
  const [plugin, sidebarGroup] = createStarlightTypeDocPlugin();

  return {
    name,
    label,
    sidebarGroup,
    plugin: plugin({
      entryPoints: [`../../packages/${name}/src/index.ts`],
      tsconfig: `../../packages/${name}/tsconfig.build.json`,
      output: `docs/frameworks/${name}/api`,
      sidebar: { label: 'API reference', collapsed: true },
      typeDoc: {
        excludePrivate: true,
        excludeInternal: true,
        readme: 'none',
        gitRevision: 'main',
      },
    }),
  };
});

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
      // Footer: Privacy, llms.txt, GitHub and Sponsor links under every docs page. SiteTitle: adds the version.
      components: {
        Footer: './src/components/overrides/Footer.astro',
        SiteTitle: './src/components/overrides/SiteTitle.astro',
      },
      customCss: [
        '@fontsource-variable/jost',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/theme.css',
      ],
      plugins: [
        // Changelog pages per version, from packages/core/CHANGELOG.md (written by Changesets).
        starlightChangelogs(),
        // API reference generated from the TSDoc comments of the core package.
        starlightTypeDoc({
          entryPoints: [
            '../../packages/core/src/index.ts',
            '../../packages/core/src/sequences.ts',
            '../../packages/core/src/format.ts',
          ],
          tsconfig: '../../packages/core/tsconfig.build.json',
          output: 'docs/api',
          sidebar: { label: 'API reference', collapsed: false },
          typeDoc: {
            excludePrivate: true,
            excludeInternal: true,
            readme: 'none',
            // Source links follow the release branch, not the local commit.
            gitRevision: 'main',
          },
        }),
        ...adapterApis.map(({ plugin }) => plugin),
        // /llms.txt, /llms-full.txt and /llms-small.txt for AI assistants.
        starlightLlmsTxt({
          projectName: 'shortcutter',
          // Page sources as written: the plugin cannot render the React/Vue/Svelte/Solid demo islands.
          rawContent: true,
          description:
            'Tiny, dependency-free keyboard shortcuts for the browser with contexts, key phases, wildcards, sequences and self-documenting shortcuts. Adapters for React, Vue, Svelte and Solid.',
        }),
      ],
      sidebar: [
        { label: 'Start here', items: [{ slug: 'docs' }, { slug: 'docs/ai' }] },
        {
          label: 'Guides',
          items: [
            { slug: 'docs/guides/games' },
            { slug: 'docs/guides/apps' },
            { slug: 'docs/guides/websites' },
          ],
        },
        {
          label: 'Frameworks',
          items: adapterApis.map(({ name, label, sidebarGroup }) => ({
            label,
            collapsed: true,
            items: [{ label: 'Guide', slug: `docs/frameworks/${name}` }, sidebarGroup],
          })),
        },
        { label: 'Comparison', slug: 'docs/comparison' },
        {
          label: 'Changelog',
          items: makeChangelogsSidebarLinks([
            { type: 'latest', base: 'docs/changelog', label: 'Latest version' },
            { type: 'all', base: 'docs/changelog', label: 'All versions' },
          ]),
        },
        typeDocSidebarGroup,
      ],
    }),
    // Live adapter demos on the landing page. React and Solid both use JSX, so each owns a folder.
    react({ include: [/\/demos\/react\//] }),
    solid({ include: [/\/demos\/solid\//] }),
    vue(),
    svelte(),
  ],
});
