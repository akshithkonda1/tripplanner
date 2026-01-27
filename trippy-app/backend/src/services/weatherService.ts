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
  humidity: number;
  wind: {
    speed: number;
    direction: string;
  };
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

export async function getWeatherForecast(
  locations: Location[],
  startDate: string,
  endDate: string
): Promise<WeatherForecast[]> {
  const forecasts: WeatherForecast[] = [];

  for (const location of locations) {
    try {
      const response = await axios.get(`${WEATHER_API_BASE}/forecast.json`, {
        params: {
          key: WEATHER_API_KEY,
          q: `${location.lat},${location.lng}`,
          days: calculateDays(startDate, endDate),
          aqi: 'no'
        }
      });

      const dailyForecasts: DailyForecast[] = response.data.forecast.forecastday.map(
        (day: any) => ({
          date: day.date,
          high: day.day.maxtemp_f,
          low: day.day.mintemp_f,
          condition: day.day.condition.text,
          precipitation: day.day.daily_chance_of_rain,
          humidity: day.day.avghumidity,
          wind: {
            speed: day.day.maxwind_mph,
            direction: 'N' // Simplified
          }
        })
      );

      forecasts.push({
        location,
        forecasts: dailyForecasts
      });
    } catch (error) {
      console.error(`Failed to get weather for ${location.lat},${location.lng}:`, error);
      // Return mock data on error for development
      forecasts.push({
        location,
        forecasts: generateMockForecast(startDate, endDate)
      });
    }
  }

  return forecasts;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays + 1, 14); // API limit is typically 14 days
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
        direction: 'NW'
      }
    });
  }

  return forecasts;
}
