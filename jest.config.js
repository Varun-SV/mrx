/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    // Mock the provider adapter in all tests (must come before the .js stripper)
    '^.*/providers/adapter\\.js$': '<rootDir>/tests/mocks/provider.mock.ts',
    // Strip .js extensions for NodeNext module resolution
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  // adapter.ts is always replaced by moduleNameMapper mock — exclude from coverage
  collectCoverageFrom: ['src/**/*.ts', '!src/cli/index.ts', '!src/providers/adapter.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
