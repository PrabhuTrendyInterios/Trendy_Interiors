module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  clearMocks: true,
  restoreMocks: true,
  // Route tests can be delayed under parallel load on Windows CI/dev machines.
  testTimeout: 15000,
  maxWorkers: '50%',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/seed*.js',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
};
