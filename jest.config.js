/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/src/**/*.test.ts'],
  transform: {
    "^.+\\.tsx?$": ["ts-jest",{}],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  runner: 'groups',
};