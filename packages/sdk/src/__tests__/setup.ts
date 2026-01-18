// Jest setup file for SDK tests

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for async tests
jest.setTimeout(10000);
