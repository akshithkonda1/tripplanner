import axios from 'axios';
import { calculateRoute, calculateMultiLegRoute, findPlacesNearRoute } from '../services/mapsService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Routing defaults to the free, keyless OSRM public router.
const osrmRoute = (meters: number, seconds: number, geometry = 'abc123') => ({
  data: { code: 'Ok', routes: [{ distance: meters, duration: seconds, geometry }], waypoints: [] },
});

describe('Maps Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ROUTING_PROVIDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('calculateRoute (OSRM, free/keyless)', () => {
    it('calculates a route between two points', async () => {
      mockedAxios.get.mockResolvedValue(osrmRoute(4500000, 9000));

      const result = await calculateRoute(
        { lat: 40.7128, lng: -74.006 },
        { lat: 34.0522, lng: -118.2437 }
      );

      expect(result.distance).toBeCloseTo(2796.17, 0); // ~2796 miles
      expect(result.duration).toBeCloseTo(150, 0); // 9000s -> 150 min
      expect(result.polyline).toBe('abc123');
      expect(result.steps.length).toBeGreaterThan(0);

      const [url] = mockedAxios.get.mock.calls[0];
      expect(url).toContain('router.project-osrm.org');
      // lng,lat order in the path
      expect(url).toContain('-74.006,40.7128;-118.2437,34.0522');
    });

    it('returns a straight-line fallback on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await calculateRoute(
        { lat: 40.7128, lng: -74.006 },
        { lat: 34.0522, lng: -118.2437 }
      );

      expect(result.distance).toBeGreaterThan(0);
      expect(result.steps).toHaveLength(1);
    });

    it('includes waypoints in the OSRM path', async () => {
      mockedAxios.get.mockResolvedValue(osrmRoute(5000000, 10800));

      await calculateRoute(
        { lat: 40.7128, lng: -74.006 },
        { lat: 34.0522, lng: -118.2437 },
        [{ lat: 41.8781, lng: -87.6298 }]
      );

      const [url] = mockedAxios.get.mock.calls[0];
      expect(url).toContain('-87.6298,41.8781'); // waypoint present
    });

    it('uses GraphHopper when configured with a key', async () => {
      process.env.ROUTING_PROVIDER = 'graphhopper';
      process.env.GRAPHHOPPER_API_KEY = 'test-key';
      mockedAxios.get.mockResolvedValue({
        data: {
          paths: [{
            distance: 4500000,
            time: 9000000,
            points: { coordinates: [[-74.006, 40.7128], [-118.2437, 34.0522]] },
            instructions: [{ text: 'Go', distance: 1000, time: 60000, points: [[-74.006, 40.7128], [-74.005, 40.713]] }],
          }],
        },
      });

      const result = await calculateRoute(
        { lat: 40.7128, lng: -74.006 },
        { lat: 34.0522, lng: -118.2437 }
      );

      expect(result.distance).toBeCloseTo(2796.17, 0);
      const [url] = mockedAxios.get.mock.calls[0];
      expect(url).toBe('https://graphhopper.com/api/1/route');
    });
  });

  describe('calculateMultiLegRoute (Home -> Little Rock -> LA -> Moab)', () => {
    it('produces one leg per hop plus totals', async () => {
      mockedAxios.get.mockResolvedValue(osrmRoute(1609340, 3600)); // 1000 mi, 60 min each

      const stops = [
        { lat: 39.0, lng: -94.6, name: 'Home' },
        { lat: 34.7, lng: -92.3, name: 'Little Rock' },
        { lat: 34.05, lng: -118.24, name: 'Los Angeles' },
        { lat: 38.57, lng: -109.55, name: 'Moab' },
      ];

      const result = await calculateMultiLegRoute(stops);

      expect(result.legs).toHaveLength(3); // 4 stops -> 3 legs
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result.legs[0].from.name).toBe('Home');
      expect(result.legs[0].to.name).toBe('Little Rock');
      expect(result.totalDistance).toBeCloseTo(3000, 0); // 3 x ~1000 mi
      expect(result.totalDuration).toBeCloseTo(180, 0); // 3 x 60 min
    });

    it('throws when given fewer than two stops', async () => {
      await expect(calculateMultiLegRoute([{ lat: 1, lng: 2 }])).rejects.toThrow(
        'at least two stops'
      );
    });
  });

  describe('findPlacesNearRoute', () => {
    it('finds places near the route', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          elements: [
            {
              lat: 40.7128,
              lon: -74.006,
              tags: { name: 'Test Restaurant', amenity: 'restaurant', 'addr:street': '123 Main St', 'addr:city': 'New York' },
            },
          ],
        },
      });

      const result = await findPlacesNearRoute(
        [{ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 }],
        'restaurant'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Test Restaurant');
    });

    it('returns an empty array on error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const result = await findPlacesNearRoute(
        [{ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 }],
        'restaurant'
      );

      expect(result).toEqual([]);
    });
  });
});
