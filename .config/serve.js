import path from 'path';
import { create as createDevelopment } from './development.js';

export function create() {
  return {
    ...createDevelopment(),
    devServer: {
      static: {
        directory: path.join(process.cwd(), 'dist'),
      },
      compress: true,
      port: 9000,
    },
  };
}
