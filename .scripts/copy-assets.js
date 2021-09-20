import fse from 'fs-extra';
import path from 'path';

const TARGET_PATH = './bundle/';
const {
  author,
  bugs,
  description,
  homepage,
  keywords,
  license,
  name,
  repository,
  version,
} = fse.readJsonSync('./package.json', { encoding: 'utf-8' });
[
  'LICENSE',
  'README.md',
].forEach((file) => {
  fse.copySync(
    path.resolve(`./${file}`),
    path.resolve(`${TARGET_PATH}${file}`),
    { overwrite: true });
});

fse.writeJSONSync(`${TARGET_PATH}/package.json`, {
  author,
  bugs,
  description,
  homepage,
  'jsnext:main': './jsnext/index.js',
  jsdelivr: './umd/shortcutter.umd.js',
  keywords,
  license,
  main: './cjs/index.js',
  module: './esm/index.js',
  name,
  repository,
  typings: './types/index.d.ts',
  unpkg: './umd/shortcutter.umd.js',
  version,
}, {
  spaces: 2,
  replacer: null,
});
