// Enforce mocking of all network calls by default
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Unmocked fetch call. Please mock global.fetch in this test.')),
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

// Mock expo-secure-store to avoid platform-specific issues in tests
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
}));
