import axios from 'axios';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface WeatherForecast {
  location: Location;
  forecasts: DailyForecast[];
}

interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
  humidity?: number;
  wind: {
    speed: number;
    direction: string;
  };
}

// Weather is FREE by default. The Trippy iOS app uses Apple's native WeatherKit
// (free with an Apple Developer account, no server key). This backend uses
// Open-Meteo for server-side planning: it's free for non-commercial use and
// requires no API key at all. `WEATHER_PROVIDER=mock` forces offline mock data.
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

function weatherProvider(): string {
  return (process.env.WEATHER_PROVIDER || 'open-meteo').toLowerCase();
}

// Open-Meteo's free forecast horizon is ~16 days out.
const MAX_FORECAST_DAYS = 16;

export async function getWeatherForecast(
  locations: Location[],
  startDate: string,
  endDate: string
): Promise<WeatherForecast[]> {
  const forecasts: WeatherForecast[] = [];

  const provider = weatherProvider();

  for (const location of locations) {
    if (provider === 'mock') {
      forecasts.push({ location, forecasts: generateMockForecast(startDate, endDate) });
      continue;
    }

    try {
      const { start, end } = clampToForecastWindow(startDate, endDate);

      const response = await axios.get(OPEN_METEO_BASE, {
        params: {
          latitude: location.lat,
          longitude: location.lng,
          daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_probability_max',
            'wind_speed_10m_max',
            'wind_direction_10m_dominant',
          ].join(','),
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
          timezone: 'auto',
          start_date: start,
          end_date: end,
        },
      });

      forecasts.push({
        location,
        forecasts: parseOpenMeteo(response.data),
      });
    } catch (error) {
      console.error(`Failed to get weather for ${location.lat},${location.lng}:`, error);
      // Fall back to mock data so planning still works offline / out of range.
      forecasts.push({
        location,
        forecasts: generateMockForecast(startDate, endDate),
      });
    }
  }

  return forecasts;
}

function parseOpenMeteo(data: any): DailyForecast[] {
  const daily = data?.daily;
  if (!daily || !Array.isArray(daily.time)) {
    throw new Error('Unexpected Open-Meteo response: missing daily data');
  }

  return daily.time.map((date: string, i: number) => ({
    date,
    high: Math.round(daily.temperature_2m_max?.[i] ?? 0),
    low: Math.round(daily.temperature_2m_min?.[i] ?? 0),
    condition: weatherCodeToText(daily.weather_code?.[i]),
    precipitation: daily.precipitation_probability_max?.[i] ?? 0,
    wind: {
      speed: Math.round(daily.wind_speed_10m_max?.[i] ?? 0),
      direction: degreesToCompass(daily.wind_direction_10m_dominant?.[i]),
    },
  }));
}

// WMO weather interpretation codes -> friendly text.
// https://open-meteo.com/en/docs
function weatherCodeToText(code: number | undefined | null): string {
  if (code === null || code === undefined) return 'Unknown';
  const map: Record<number, string> = {
    0: 'Sunny',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm',
  };
  return map[code] ?? 'Unknown';
}

function degreesToCompass(deg: number | undefined | null): string {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return 'N';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return dirs[index];
}

// Open-Meteo's free forecast only reaches ~16 days ahead. Clamp the requested
// window into that range; anything fully out of range will error and fall back
// to mock data.
function clampToForecastWindow(
  startDate: string,
  endDate: string
): { start: string; end: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + MAX_FORECAST_DAYS - 1);

  const effectiveEnd = end.getTime() < start.getTime()
    ? start
    : end.getTime() > maxEnd.getTime()
      ? maxEnd
      : end;

  return {
    start: toISODate(start),
    end: toISODate(effectiveEnd),
  };
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays + 1, MAX_FORECAST_DAYS);
}

function generateMockForecast(startDate: string, endDate: string): DailyForecast[] {
  const days = calculateDays(startDate, endDate);
  const forecasts: DailyForecast[] = [];
  const conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain'];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    forecasts.push({
      date: date.toISOString().split('T')[0],
      high: 70 + Math.floor(Math.random() * 20),
      low: 50 + Math.floor(Math.random() * 15),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      precipitation: Math.floor(Math.random() * 30),
      humidity: 40 + Math.floor(Math.random() * 30),
      wind: {
        speed: 5 + Math.floor(Math.random() * 15),
        direction: 'NW',
      },
    });
  }

  return forecasts;
}
