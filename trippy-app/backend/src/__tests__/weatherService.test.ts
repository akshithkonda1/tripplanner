import axios from 'axios';
import { getWeatherForecast } from '../services/weatherService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEATHER_API_KEY = 'test-api-key';
  });

  describe('getWeatherForecast', () => {
    it('should return weather forecast for locations', async () => {
      const mockResponse = {
        data: {
          forecast: {
            forecastday: [
              {
                date: '2024-07-01',
                day: {
                  maxtemp_f: 85,
                  mintemp_f: 65,
                  condition: { text: 'Sunny' },
                  daily_chance_of_rain: 10,
                  avghumidity: 45,
                  maxwind_mph: 12
                }
              },
              {
                date: '2024-07-02',
                day: {
                  maxtemp_f: 82,
                  mintemp_f: 63,
                  condition: { text: 'Partly cloudy' },
                  daily_chance_of_rain: 20,
                  avghumidity: 50,
                  maxwind_mph: 8
                }
              }
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const locations = [
        { lat: 40.7128, lng: -74.0060, name: 'New York' }
      ];

      const result = await getWeatherForecast(
        locations,
        '2024-07-01',
        '2024-07-02'
      );

      expect(result).toHaveLength(1);
      expect(result[0].forecasts).toHaveLength(2);
      expect(result[0].forecasts[0].high).toBe(85);
      expect(result[0].forecasts[0].condition).toBe('Sunny');
    });

    it('should return mock data on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const locations = [
        { lat: 40.7128, lng: -74.0060, name: 'New York' }
      ];

      const result = await getWeatherForecast(
        locations,
        '2024-07-01',
        '2024-07-03'
      );

      expect(result).toHaveLength(1);
      expect(result[0].forecasts.length).toBeGreaterThan(0);
      // Should have mock data
      expect(result[0].forecasts[0]).toHaveProperty('high');
      expect(result[0].forecasts[0]).toHaveProperty('low');
    });

    it('should handle multiple locations', async () => {
      const mockResponse = {
        data: {
          forecast: {
            forecastday: [
              {
                date: '2024-07-01',
                day: {
                  maxtemp_f: 80,
                  mintemp_f: 60,
                  condition: { text: 'Clear' },
                  daily_chance_of_rain: 5,
                  avghumidity: 40,
                  maxwind_mph: 10
                }
              }
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const locations = [
        { lat: 40.7128, lng: -74.0060, name: 'New York' },
        { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
        { lat: 41.8781, lng: -87.6298, name: 'Chicago' }
      ];

      const result = await getWeatherForecast(
        locations,
        '2024-07-01',
        '2024-07-01'
      );

      expect(result).toHaveLength(3);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });
});
