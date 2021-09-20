import path from 'path';
import { create as createBase } from './base.js';

export function create() {
  return {
    ...createBase(),
    entry: './src/index',
    target: 'web',
    devtool: false,
    mode: 'production',
    output: {
      filename: 'shortcutter.umd.js',
      path: path.resolve(process.cwd(), 'bundle'),
      library: 'Shortcutter',
    },
  }
}
