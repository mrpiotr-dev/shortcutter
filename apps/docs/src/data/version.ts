import pkg from 'shortcutter/package.json';

/** The released version of `shortcutter`, shown next to the site title. Bumped only by releases. */
export const VERSION: string = pkg.version;

/** Where the version label links: the changelog of the latest release. */
export const CHANGELOG_URL = '/docs/changelog/';
