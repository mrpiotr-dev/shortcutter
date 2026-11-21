# Changesets

Every pull request that changes a published package adds a changeset:

```sh
pnpm changeset
```

Pick the packages, the bump (in 0.x, breaking changes are `minor`) and write what changed for users. The five packages (`shortcutter` and `@shortcutter/*`) are released together with the same version. See CONTRIBUTING.md for the release steps.
