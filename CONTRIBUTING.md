# Contributing

I'm glad you reach this repository!
The community's pull requests will be unavailable until the `Contributor License Agreement` document and form are ready.

## Development

The repository is a [pnpm](https://pnpm.io) workspace driven by [Vite+](https://viteplus.dev) (`vp`):

| Path                                 | What                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| `packages/core/`                     | `shortcutter`, the core library                                |
| `packages/{react,vue,svelte,solid}/` | `@shortcutter/*` framework adapters                            |
| `apps/playground/`                   | local sandbox, uses the library sources with HMR               |
| `apps/docs/`                         | www.shortcutter.dev: landing page and docs (Astro + Starlight) |

```sh
corepack enable
pnpm install          # also installs the pre-commit hook (vp staged)
pnpm run dev          # playground on http://localhost:5173
pnpm run check        # format, lint & type-check
pnpm run test         # unit tests
pnpm run build        # library build (+ publint, attw) and playground build
```

## Documentation

The site at www.shortcutter.dev lives in `apps/docs/` (Astro + Starlight). It imports the built packages, so build them once before starting it, and again after changing a package:

```sh
pnpm run build                  # packages first: the docs use their dist/ and type declarations
pnpm --filter docs run dev      # http://localhost:4321/, reloads on content changes
pnpm --filter docs run build    # full static build into apps/docs/dist/, the same as CI
```

### Where things are

| Path in `apps/docs/`                              | What                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/content/docs/docs/`                          | the docs pages (`.mdx`): getting started, `guides/`, `frameworks/`, comparison |
| `astro.config.mjs`                                | sidebar, API reference, llms.txt and changelog setup                           |
| `src/pages/index.astro`, `src/scripts/landing.ts` | the landing page and its interactive demos                                     |
| `src/components/demos/{react,vue,svelte,solid}/`  | live framework islands, used by the landing and the framework pages            |
| `src/styles/theme.css`, `src/code-themes.mjs`     | Bauhaus theme and code-block colours                                           |

### Adding or changing a page

- Write pages in MDX under `src/content/docs/docs/`. A new page also needs an entry in `sidebar` in `astro.config.mjs`.
- Keep the root `README.md` in step with the docs: it is the npm page of `shortcutter`. Each adapter's `README.md` is its npm page and links to its framework guide.
- Write shortcuts the way the API takes them (`'ControlOrMeta+K'`) in code, and as keycaps in text: `<kbd>⌘</kbd> + <kbd>K</kbd>`.
- The formatter skips `.mdx` (it breaks code fences inside components), so format code in MDX by hand, in the repository style.
- Code blocks use the themes in `src/code-themes.mjs`. Keep every token colour at 5.5:1 contrast or more on its background, in both themes.
- A live demo is a framework component in `src/components/demos/<framework>/`, used in MDX with `client:visible`. React and Solid both use JSX, so each one's components must stay in its own folder: the integrations pick files by folder.

### Generated pages

These are generated during the build and are not committed (see `apps/docs/.gitignore`), so change their source instead:

- **API reference** (`/docs/api/` for the core, `/docs/frameworks/<framework>/api/` for each adapter): built by TypeDoc from the TSDoc comments in `packages/*/src/`. Document every export there, with an `@example` where it helps.
- **Changelog** (`/docs/changelog/`): built from `packages/core/CHANGELOG.md`, which Changesets writes.
- **`/llms.txt`, `/llms-full.txt`, `/llms-small.txt`**: built from the page sources.

### Deployment

Cloudflare Workers Builds deploys `main` to www.shortcutter.dev and uploads a preview version for every other branch. Setup and URL rules are in [`apps/docs/README.md`](apps/docs/README.md).

## Branches

- `main`: released code only. Pull requests come from `develop` (or `hotfix/*`) and are merged with a merge commit, never squashed: a squash would give `main` commits that `develop` does not have.
- `develop`: the default branch where finished work is integrated. Task branches are merged into it with a merge commit, which keeps their commits; squash a branch only when its commits are not worth keeping.
- Task branches follow [Conventional Branch](https://conventionalbranch.org): `<type>/<description>`, with type `feature` (or `feat`), `bugfix` (or `fix`), `hotfix`, `release` or `chore`. Use lowercase letters, digits and single hyphens; dots only in versions. Examples: `feat/issue-12-mod-key`, `fix/meta-stuck-keys`, `release/v0.3.0`.
- Hotfixes branch from `main`, merge into `main`, then back into `develop`.

The `Branch rules` workflow checks branch names and the source branch of pull requests into `main`.

## Changes and releases

Every pull request that changes a published package adds a changeset (`pnpm changeset`): the packages, the bump (in 0.x, breaking changes are `minor`) and what changed for users. `shortcutter` and the four `@shortcutter/*` adapters are released together with the same version.

To release:

1. Branch `release/vX.Y.Z` from `develop` and run `pnpm run version-packages`. It bumps the versions, writes `CHANGELOG.md` in every package and removes the used changesets. Commit and merge it into `develop`.
2. Open a pull request from `develop` into `main` and merge it with a merge commit. That runs the Release workflow: it builds, publishes the new versions to npm with provenance (npm Trusted Publishing, no token), pushes a git tag per package (`shortcutter@X.Y.Z`, `@shortcutter/react@X.Y.Z`, …) and creates a GitHub release with the changelog.

Every change reaches `main` through `develop`, so nothing has to be merged back. `main` only gains merge commits, which change no files. The exception is a hotfix: branch it from `main`, merge it into `main`, then merge `main` into `develop`.

The documentation shows the same changelog at `/docs/changelog/`, one page per version, built from `packages/core/CHANGELOG.md`.
