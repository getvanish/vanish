// Jest setup file for CLI tests

// Mock child_process
jest.mock('child_process');

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  mkdtempSync: jest.fn(),
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for async tests
jest.setTimeout(10000);
