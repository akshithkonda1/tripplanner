import axios from 'axios';
import { getWeatherForecast } from '../services/weatherService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Weather uses the free, keyless Open-Meteo API on the backend (the iOS app
// uses Apple WeatherKit natively). These tests mock the Open-Meteo response.
describe('Weather Service (Open-Meteo, free/keyless)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.WEATHER_PROVIDER;
  });

  function openMeteoResponse(days: Array<{
    date: string;
    code: number;
    max: number;
    min: number;
    precip: number;
    wind: number;
    windDir: number;
  }>) {
    return {
      data: {
        daily: {
          time: days.map(d => d.date),
          weather_code: days.map(d => d.code),
          temperature_2m_max: days.map(d => d.max),
          temperature_2m_min: days.map(d => d.min),
          precipitation_probability_max: days.map(d => d.precip),
          wind_speed_10m_max: days.map(d => d.wind),
          wind_direction_10m_dominant: days.map(d => d.windDir),
        },
      },
    };
  }

  describe('getWeatherForecast', () => {
    it('maps Open-Meteo daily data to forecasts', async () => {
      mockedAxios.get.mockResolvedValue(
        openMeteoResponse([
          { date: '2024-07-01', code: 0, max: 85.4, min: 64.6, precip: 10, wind: 12, windDir: 90 },
          { date: '2024-07-02', code: 2, max: 82.1, min: 63.2, precip: 20, wind: 8, windDir: 270 },
        ])
      );

      const result = await getWeatherForecast(
        [{ lat: 40.7128, lng: -74.006, name: 'New York' }],
        '2024-07-01',
        '2024-07-02'
      );

      expect(result).toHaveLength(1);
      expect(result[0].forecasts).toHaveLength(2);
      expect(result[0].forecasts[0]).toMatchObject({
        date: '2024-07-01',
        high: 85, // rounded from 85.4
        low: 65, // rounded from 64.6
        condition: 'Sunny', // WMO code 0
        precipitation: 10,
      });
      expect(result[0].forecasts[0].wind).toEqual({ speed: 12, direction: 'E' }); // 90deg -> E
      expect(result[0].forecasts[1].condition).toBe('Partly cloudy'); // WMO code 2
      expect(result[0].forecasts[1].wind.direction).toBe('W'); // 270deg -> W
    });

    it('calls Open-Meteo with no API key and fahrenheit/mph units', async () => {
      mockedAxios.get.mockResolvedValue(
        openMeteoResponse([
          { date: '2024-07-01', code: 61, max: 70, min: 55, precip: 80, wind: 15, windDir: 0 },
        ])
      );

      await getWeatherForecast([{ lat: 1, lng: 2 }], '2024-07-01', '2024-07-01');

      const [url, config] = mockedAxios.get.mock.calls[0];
      expect(url).toContain('open-meteo.com');
      expect((config as any).params).toMatchObject({
        latitude: 1,
        longitude: 2,
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
      });
      // No API key is ever sent.
      expect(JSON.stringify(config)).not.toMatch(/key/i);
    });

    it('returns mock data on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await getWeatherForecast(
        [{ lat: 40.7128, lng: -74.006, name: 'New York' }],
        '2024-07-01',
        '2024-07-03'
      );

      expect(result).toHaveLength(1);
      expect(result[0].forecasts.length).toBeGreaterThan(0);
      expect(result[0].forecasts[0]).toHaveProperty('high');
      expect(result[0].forecasts[0]).toHaveProperty('low');
    });

    it('handles multiple locations', async () => {
      mockedAxios.get.mockResolvedValue(
        openMeteoResponse([
          { date: '2024-07-01', code: 1, max: 80, min: 60, precip: 5, wind: 10, windDir: 45 },
        ])
      );

      const result = await getWeatherForecast(
        [
          { lat: 40.7128, lng: -74.006, name: 'New York' },
          { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
          { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
        ],
        '2024-07-01',
        '2024-07-01'
      );

      expect(result).toHaveLength(3);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result[0].forecasts[0].wind.direction).toBe('NE'); // 45deg -> NE
    });

    it('supports a forced offline mock provider without any network call', async () => {
      process.env.WEATHER_PROVIDER = 'mock';

      const result = await getWeatherForecast(
        [{ lat: 1, lng: 2 }],
        '2024-07-01',
        '2024-07-02'
      );

      expect(result[0].forecasts.length).toBeGreaterThan(0);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
