module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'server/tsconfig.json',
      useESM: false
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
