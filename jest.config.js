module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/__tests__/setup/',
    // Full App mount needs native modules beyond unit-test scope.
    '<rootDir>/__tests__/App.test.tsx',
    // Dev utility file misnamed *.test.ts — not a Jest suite.
    '<rootDir>/src/utils/staticMapApi.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
