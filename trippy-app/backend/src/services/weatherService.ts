import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface Coordinates {
  lat: number;
  lng: number;
  name?: string;
}

interface WeatherForecast {
  location: string;
  coordinates: Coordinates;
  forecast: Array<{
    date: string;
    temp: {
      min: number;
      max: number;
      avg: number;
    };
    conditions: string;
    description: string;
    precipitation: number;
    humidity: number;
    windSpeed: number;
  }>;
}

export async function getWeatherForecast(
  locations: Coordinates[],
  startDate: string,
  endDate: string
): Promise<WeatherForecast[]> {
  const forecasts: WeatherForecast[] = [];

  for (const location of locations) {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
          lat: location.lat,
          lon: location.lng,
          appid: OPENWEATHER_API_KEY,
          units: 'imperial',
          cnt: 40 // 5 days, 3-hour intervals
        }
      });

      const forecast = processWeatherData(response.data, location);
      forecasts.push(forecast);
    } catch (error) {
      console.error(`Failed to fetch weather for ${location.name}:`, error);
      // Return basic forecast if API fails
      forecasts.push(getDefaultForecast(location));
    }
  }

  return forecasts;
}

function processWeatherData(data: any, location: Coordinates): WeatherForecast {
  const dailyForecasts = new Map<string, any[]>();

  // Group forecasts by day
  data.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dailyForecasts.has(date)) {
      dailyForecasts.set(date, []);
    }
    dailyForecasts.get(date)!.push(item);
  });

  // Process each day
  const forecast = Array.from(dailyForecasts.entries()).map(([date, items]) => {
    const temps = items.map(i => i.main.temp);
    const conditions = items[Math.floor(items.length / 2)].weather[0];

    return {
      date,
      temp: {
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
        avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
      },
      conditions: conditions.main,
      description: conditions.description,
      precipitation: items.reduce((sum, i) => sum + (i.pop || 0), 0) / items.length * 100,
      humidity: items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length,
      windSpeed: items.reduce((sum, i) => sum + i.wind.speed, 0) / items.length
    };
  });

  return {
    location: location.name || `${location.lat}, ${location.lng}`,
    coordinates: location,
    forecast
  };
}

function getDefaultForecast(location: Coordinates): WeatherForecast {
  return {
    location: location.name || `${location.lat}, ${location.lng}`,
    coordinates: location,
    forecast: []
  };
}

export async function getRouteWeather(
  routeCoordinates: Coordinates[],
  date: string
): Promise<Map<string, any>> {
  const weatherMap = new Map();

  // Sample points along route (every ~50 miles)
  const sampledPoints = sampleRoutePoints(routeCoordinates, 50);

  for (const point of sampledPoints) {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
          lat: point.lat,
          lon: point.lng,
          appid: OPENWEATHER_API_KEY,
          units: 'imperial'
        }
      });

      weatherMap.set(`${point.lat},${point.lng}`, response.data);
    } catch (error) {
      console.error('Failed to fetch route weather:', error);
    }
  }

  return weatherMap;
}

function sampleRoutePoints(
  coordinates: Coordinates[],
  intervalMiles: number
): Coordinates[] {
  // Simple sampling - take every Nth point
  // In production, calculate actual distances
  const step = Math.max(1, Math.floor(coordinates.length / 10));
  return coordinates.filter((_, index) => index % step === 0);
}
