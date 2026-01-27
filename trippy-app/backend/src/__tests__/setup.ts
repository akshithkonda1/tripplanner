// Jest setup file

// Set test environment variables
process.env.TRIPS_TABLE = 'test-trips-table';
process.env.MESSAGES_TABLE = 'test-messages-table';
process.env.ITINERARY_TABLE = 'test-itinerary-table';
process.env.CONNECTIONS_TABLE = 'test-connections-table';
process.env.USERS_TABLE = 'test-users-table';
process.env.WEATHER_API_KEY = 'test-weather-key';
process.env.GRAPHHOPPER_API_KEY = 'test-graphhopper-key';

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Suppress expected error messages in tests
  if (
    args[0]?.includes?.('Failed to') ||
    args[0]?.includes?.('API Error')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
  console.error = originalConsoleError;
});
