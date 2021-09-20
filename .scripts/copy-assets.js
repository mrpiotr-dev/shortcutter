import fse from 'fs-extra';
import path from 'path';
import glob from 'glob';

const TARGET_PATH = './bundle/';

// fse.copySync(
//   path.resolve(`./${file}`),
//   path.resolve(`${TARGET_PATH}${file}`),
//   { overwrite: true });

// glob
//   .sync('./esm/**/*.js', { cwd: TARGET_PATH })
//   .forEach((filePath) => {
//     fse.copySync(
//       path.resolve(`${TARGET_PATH}/${filePath}`),
//       path.resolve(`${TARGET_PATH}/${filePath.replace('./esm/', '').replace('.js', '.mjs')}`),
//       { overwrite: true }
//     );
//   })