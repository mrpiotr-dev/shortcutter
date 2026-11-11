# Contributing

I'm glad you reach this repository!
The community's pull requests will be unavailable until the `Contributor License Agreement` document and form are ready.

## Development

The repository is a [pnpm](https://pnpm.io) workspace driven by [Vite+](https://viteplus.dev) (`vp`):

| Path                    | What                                                |
| ----------------------- | --------------------------------------------------- |
| `packages/shortcutter/` | the published library                               |
| `apps/playground/`      | local sandbox, uses the library sources with HMR    |
| `docs/`                 | current GitHub Pages site (to be replaced by Astro) |

```sh
corepack enable
pnpm install          # also installs the pre-commit hook (vp staged)
pnpm run dev          # playground on http://localhost:5173
pnpm run check        # format, lint & type-check
pnpm run test         # unit tests
pnpm run build        # library build (+ publint, attw) and playground build
```
