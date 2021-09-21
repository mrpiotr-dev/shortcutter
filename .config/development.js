import path from 'path';
import { create as createBase } from './base.js';

export function create() {
  return {
    ...createBase(),
    entry: './local/dev.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    output: {
      filename: 'dev.js',
      path: path.resolve(process.cwd(), 'dist'),
    },
  }
}
