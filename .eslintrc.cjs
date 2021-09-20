module.exports = {
  root: true,
  env: {
    browser: true,
    'es2021': true,
    'node': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    createDefaultProgram: true,
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'license-header'
  ],
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        FunctionDeclaration: { parameters: 'first' },
        FunctionExpression: { parameters: 'first' }
      }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    quotes: [
      'error',
      'single'
    ],
    semi: [
      'error',
      'always'
    ],
    'eol-last': [
      'error',
      'always'
    ],
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      {
        allowHigherOrderFunctions: true,
      }
    ]
  },
  overrides: [
    {
      files: ['**/src/**/*.ts'],
      rules: {
        'license-header/header': [ 'error', './.config/license-header.js' ],
      }
    },
  ],
};
