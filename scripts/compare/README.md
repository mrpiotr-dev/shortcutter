# Comparison measurements

The numbers on [shortcutter.dev/docs/comparison](https://www.shortcutter.dev/docs/comparison/) come from these scripts.

```sh
pnpm run build                                  # shortcutter is measured from this repository's builds
node scripts/compare/install.mjs /tmp/compare   # the other libraries, pinned in libraries.mjs, no install scripts
node scripts/compare/size.mjs /tmp/compare      # size table (Markdown)
node scripts/compare/behaviour.mjs /tmp/compare # game input and alt-tab tables (Markdown)
```

- `libraries.mjs`: the compared libraries and their pinned versions. Use versions that have been on npm for at least a day.
- `install.mjs`: installs them into a separate folder, outside the workspace, with `--ignore-scripts`.
- `size.mjs`: bundles an entry re-exporting everything with Vite+ (Rolldown) in library mode, fully minified, gzip level 9.
- `behaviour.mjs`: replays the two scenarios on happy-dom, one Node process per library.

Re-run them before a release that changes the core or an entry, and update the page with the output.
