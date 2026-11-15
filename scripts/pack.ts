import type { PackUserConfig } from 'vite-plus/pack';

type Manifest = { name: string; version: string; license: string; homepage: string };

/** One license notice per built file; the sources carry no per-file headers. */
export function banner(pkg: Manifest): string {
  return `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License | Copyright (c) 2021-present SLAVICTECH PIOTR LASZCZKOWSKI | ${pkg.homepage} */`;
}

/** ESM + CJS build with types and package checks, shared by every published package. */
export function libraryPack(pkg: Manifest): PackUserConfig {
  return {
    entry: ['src/index.ts'],
    platform: 'neutral',
    target: 'es2020',
    sourcemap: true,
    banner: banner(pkg),
    outputOptions: { comments: { legal: false } },
    format: ['esm', 'cjs'],
    dts: { generator: 'tsgo' },
    exports: true,
    publint: true,
    attw: { profile: 'node16' },
  };
}
