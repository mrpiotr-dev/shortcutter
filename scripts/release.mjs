// Release helpers for .github/workflows/release.yml (staged releases).
//
//   node scripts/release.mjs summary   Markdown status of each package version, for the job summary.
//   node scripts/release.mjs tag       Tags every version that is public on npm and has no tag yet,
//                                      and creates the GitHub release of the core package.
//
// Uses only Node, git and the gh CLI, so it runs without installing the workspace.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CORE = 'shortcutter';

/** The published packages of the workspace: name, version and directory. */
function packages() {
  return readdirSync('packages')
    .map((dir) => ({ dir: join('packages', dir), manifest: join('packages', dir, 'package.json') }))
    .map(({ dir, manifest }) => ({ dir, ...JSON.parse(readFileSync(manifest, 'utf8')) }))
    .filter((pkg) => !pkg.private)
    .map(({ name, version, dir }) => ({ name, version, dir }));
}

async function isOnNpm({ name, version }) {
  const response = await fetch(`https://registry.npmjs.org/${name}/${version}`);

  if (response.status === 404) return false;
  if (!response.ok)
    throw new Error(`npm registry answered ${response.status} for ${name}@${version}`);
  return true;
}

const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();
const tagExists = (tag) => run('git', ['tag', '--list', tag]) === tag;

/** The section of packages/core/CHANGELOG.md for `version`, without its heading. */
function changelog(version) {
  const lines = readFileSync('packages/core/CHANGELOG.md', 'utf8').split('\n');
  const start = lines.indexOf(`## ${version}`);

  if (start === -1) return '';

  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));

  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim();
}

async function summary() {
  const rows = [];

  for (const pkg of packages()) {
    rows.push(
      `| \`${pkg.name}\` | ${pkg.version} | ${(await isOnNpm(pkg)) ? 'public' : 'staged, waiting for approval'} |`,
    );
  }

  console.log(`## Release

| Package | Version | On npm |
| --- | --- | --- |
${rows.join('\n')}

Staged versions become public with \`pnpm stage approve\` (2FA), run from the repository. Then
\`gh workflow run release.yml\` tags them and creates the GitHub release.`);
}

async function tag() {
  const all = packages();
  const created = [];

  for (const pkg of all) {
    const name = `${pkg.name}@${pkg.version}`;

    if (tagExists(name)) continue;
    if (!(await isOnNpm(pkg))) {
      console.log(
        `${name} is not public on npm yet: approve it with \`pnpm stage approve\` first.`,
      );
      continue;
    }

    run('git', ['tag', name]);
    created.push(name);
  }

  if (created.length > 0) {
    run('git', ['push', 'origin', ...created.map((name) => `refs/tags/${name}`)]);
    console.log(`Tagged ${created.join(', ')}.`);
  }

  const core = all.find((pkg) => pkg.name === CORE);
  const release = `${CORE}@${core.version}`;

  if (!tagExists(release)) return;

  try {
    run('gh', ['release', 'view', release, '--json', 'tagName']);
    console.log(`GitHub release ${release} already exists.`);
    return;
  } catch {
    // No release yet: create it below.
  }

  // One release for the whole fixed group, as the packages share version and changelog.
  const notes = `${changelog(core.version)}

**Packages** (all ${core.version}, released together)

${all.map(({ name }) => `- [\`${name}\`](https://www.npmjs.com/package/${name})`).join('\n')}

Docs: https://www.shortcutter.dev/
`;
  const file = join(tmpdir(), 'release-notes.md');

  writeFileSync(file, notes);
  run('gh', [
    'release',
    'create',
    release,
    '--verify-tag',
    '--title',
    `${CORE} ${core.version}`,
    '--notes-file',
    file,
    '--latest',
  ]);
  console.log(`Created the GitHub release ${release}.`);
}

const commands = { summary, tag };
const command = commands[process.argv[2]];

if (!command) {
  console.error('Usage: node scripts/release.mjs summary|tag');
  process.exit(1);
}

await command();
