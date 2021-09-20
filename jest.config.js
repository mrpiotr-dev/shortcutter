export default async () => {
  return {
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.ts'
    ],
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
      '/node_modules/',
    ],
    coverageProvider: 'v8',
    coverageReporters: ['json', 'lcov', 'clover'],
    moduleFileExtensions: [
      'ts',
      'js'
    ],
    transform: {
      '\\.ts$': 'ts-jest'
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]s?$',
    testEnvironment: 'jsdom'
  };
};
