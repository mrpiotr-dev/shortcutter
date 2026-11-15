# Contributing

I'm glad you reach this repository!
The community's pull requests will be unavailable until the `Contributor License Agreement` document and form are ready.

## Development

The repository is a [pnpm](https://pnpm.io) workspace driven by [Vite+](https://viteplus.dev) (`vp`):

| Path                                 | What                                                |
| ------------------------------------ | --------------------------------------------------- |
| `packages/core/`                     | `shortcutter`, the core library                     |
| `packages/{react,vue,svelte,solid}/` | `@shortcutter/*` framework adapters                 |
| `apps/playground/`                   | local sandbox, uses the library sources with HMR    |
| `docs/`                              | current GitHub Pages site (to be replaced by Astro) |

```sh
corepack enable
pnpm install          # also installs the pre-commit hook (vp staged)
pnpm run dev          # playground on http://localhost:5173
pnpm run check        # format, lint & type-check
pnpm run test         # unit tests
pnpm run build        # library build (+ publint, attw) and playground build
```

## Branches

- `main`: released code only. Pull requests come from `develop`, `release/*` or `hotfix/*` and are merged with a merge commit.
- `develop`: the default branch where finished work is integrated. Task branches are squash-merged into it.
- Task branches follow [Conventional Branch](https://conventionalbranch.org): `<type>/<description>`, with type `feature` (or `feat`), `bugfix` (or `fix`), `hotfix`, `release` or `chore`. Use lowercase letters, digits and single hyphens; dots only in versions. Examples: `feat/issue-12-mod-key`, `fix/meta-stuck-keys`, `release/v0.3.0`.
- Hotfixes branch from `main`, merge into `main`, then back into `develop`.

The `Branch rules` workflow checks branch names and the source branch of pull requests into `main`.

## Changes and releases

Every pull request that changes a published package adds a changeset (`pnpm changeset`): the packages, the bump (in 0.x, breaking changes are `minor`) and what changed for users. `shortcutter` and the four `@shortcutter/*` adapters are released together with the same version.

To release:

1. Branch `release/vX.Y.Z` from `develop` and run `pnpm run version-packages`. It bumps the versions, writes `CHANGELOG.md` in every package and removes the used changesets. Commit and open a pull request into `main`.
2. Merging it runs the Release workflow: it builds, publishes the new versions to npm with provenance (npm Trusted Publishing, no token), pushes a git tag per package (`shortcutter@X.Y.Z`, `@shortcutter/react@X.Y.Z`, …) and creates a GitHub release with the changelog.
3. Merge `main` back into `develop`.

The documentation shows the same changelog at `/docs/changelog/`, one page per version, built from `packages/core/CHANGELOG.md`.
