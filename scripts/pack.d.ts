import type { PackUserConfig } from 'vite-plus/pack';
type Manifest = {
  name: string;
  version: string;
  license: string;
  homepage: string;
};
/** One license notice per built file; the sources carry no per-file headers. */
export declare function banner(pkg: Manifest): string;
/** ESM + CJS build with types and package checks, shared by every published package. */
export declare function libraryPack(pkg: Manifest): PackUserConfig;
export {};
