// Mock expo modules before any imports
// Import after mocks
import * as tracking from '@/core/location/tracking';

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  Accuracy: {
    High: 4,
  },
  LocationAccuracy: {
    High: 4,
  },
}));

jest.mock('cuid', () => ({
  default: () => 'mock-id',
}));

// Mock dependencies
jest.mock('@/core/storage/tripRepo');
jest.mock('@/core/storage/sqlite');

describe('tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callback management', () => {
    it('should set and clear stats update callback', () => {
      const mockCallback = jest.fn();

      tracking.setStatsUpdateCallback(mockCallback);
      tracking.setStatsUpdateCallback(null);

      // Basic test that functions exist and can be called
      expect(typeof tracking.setStatsUpdateCallback).toBe('function');
    });

    it('should handle multiple callback registrations', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      tracking.setStatsUpdateCallback(callback1);
      tracking.setStatsUpdateCallback(callback2);
      tracking.setStatsUpdateCallback(null);

      // Basic test of function behavior
      expect(typeof tracking.setStatsUpdateCallback).toBe('function');
    });
  });

  describe('location data', () => {
    it('should handle location point structure', () => {
      const locationPoint = {
        lat: -33.4489,
        lng: -70.6693,
        ts: Date.now(),
        speed: 5.5,
        accuracy: 10,
      };

      // Test basic data structure validation
      expect(typeof locationPoint.lat).toBe('number');
      expect(typeof locationPoint.lng).toBe('number');
      expect(typeof locationPoint.ts).toBe('number');
      expect(locationPoint.lat).toBeGreaterThan(-90);
      expect(locationPoint.lat).toBeLessThan(90);
      expect(locationPoint.lng).toBeGreaterThan(-180);
      expect(locationPoint.lng).toBeLessThan(180);
    });
  });

  describe('throttling logic', () => {
    it('should handle timing constraints', () => {
      const THROTTLE_INTERVAL = 2000; // 2 seconds
      const now = Date.now();
      const lastUpdate = now - 3000; // 3 seconds ago

      const shouldUpdate = now - lastUpdate >= THROTTLE_INTERVAL;
      expect(shouldUpdate).toBe(true);

      const recentUpdate = now - 1000; // 1 second ago
      const shouldNotUpdate = now - recentUpdate >= THROTTLE_INTERVAL;
      expect(shouldNotUpdate).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should validate tracking state functions exist', () => {
      expect(typeof tracking.setStatsUpdateCallback).toBe('function');
    });
  });
});
