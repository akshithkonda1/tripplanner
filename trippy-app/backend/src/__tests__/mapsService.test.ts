import axios from 'axios';
import { calculateRoute, findPlacesNearRoute } from '../services/mapsService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Maps Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GRAPHHOPPER_API_KEY = 'test-api-key';
  });

  describe('calculateRoute', () => {
    it('should calculate route between two points', async () => {
      const mockResponse = {
        data: {
          paths: [{
            distance: 4500000, // meters
            time: 150000000, // milliseconds
            points: {
              coordinates: [
                [-74.0060, 40.7128],
                [-118.2437, 34.0522]
              ]
            },
            instructions: [
              {
                text: 'Turn right',
                distance: 1000,
                time: 60000,
                points: [
                  [-74.0060, 40.7128],
                  [-74.0050, 40.7130]
                ]
              }
            ]
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const origin = { lat: 40.7128, lng: -74.0060 };
      const destination = { lat: 34.0522, lng: -118.2437 };

      const result = await calculateRoute(origin, destination);

      expect(result.distance).toBeCloseTo(2796.17, 0); // ~2796 miles
      expect(result.duration).toBeGreaterThan(0);
      expect(result.polyline).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should return straight-line fallback on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const origin = { lat: 40.7128, lng: -74.0060 };
      const destination = { lat: 34.0522, lng: -118.2437 };

      const result = await calculateRoute(origin, destination);

      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.steps).toHaveLength(1);
    });

    it('should handle waypoints', async () => {
      const mockResponse = {
        data: {
          paths: [{
            distance: 5000000,
            time: 180000000,
            points: {
              coordinates: [
                [-74.0060, 40.7128],
                [-87.6298, 41.8781],
                [-118.2437, 34.0522]
              ]
            },
            instructions: []
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const origin = { lat: 40.7128, lng: -74.0060 };
      const destination = { lat: 34.0522, lng: -118.2437 };
      const waypoints = [{ lat: 41.8781, lng: -87.6298 }];

      const result = await calculateRoute(origin, destination, waypoints);

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://graphhopper.com/api/1/route',
        expect.any(Object)
      );
    });
  });

  describe('findPlacesNearRoute', () => {
    it('should find places near route', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              lat: 40.7128,
              lon: -74.0060,
              tags: {
                name: 'Test Restaurant',
                amenity: 'restaurant',
                'addr:street': '123 Main St',
                'addr:city': 'New York'
              }
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const route = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 34.0522, lng: -118.2437 }
      ];

      const result = await findPlacesNearRoute(route, 'restaurant');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Test Restaurant');
    });

    it('should return empty array on error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const route = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 34.0522, lng: -118.2437 }
      ];

      const result = await findPlacesNearRoute(route, 'restaurant');

      expect(result).toEqual([]);
    });
  });
});
