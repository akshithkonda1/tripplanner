import { APIGatewayProxyHandler } from 'aws-lambda';
import { bedrockService } from '../services/bedrockService';
import { getWeatherForecast } from '../services/weatherService';
import { getGasPrices, getEVCharging } from '../services/fuelService';
import { generateBookingLinks } from '../services/bookingService';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface TripPlanRequest {
  origin: Location;
  destination: Location;
  startDate: string;
  endDate: string;
  tripType: 'family' | 'couple' | 'solo';
  preferences: {
    budget?: number;
    interests?: string[];
    pace?: 'relaxed' | 'moderate' | 'fast';
    dietary?: string[];
  };
  participants?: number;
}

interface ItineraryItem {
  type: 'drive' | 'meal' | 'activity' | 'accommodation';
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime: string;
  duration: number;
  cost: number;
  description: string;
  notes: string;
  bookingLinks?: BookingLinks;
}

interface BookingLinks {
  [provider: string]: string;
}

interface Day {
  day: number;
  date: string;
  items: ItineraryItem[];
}

interface Itinerary {
  overview: string;
  totalDistance: number;
  totalDuration: number;
  estimatedCost: number;
  days: Day[];
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const request: TripPlanRequest = JSON.parse(event.body || '{}');

    // Step 1: Get weather data
    const weather = await getWeatherForecast(
      [request.origin, request.destination],
      request.startDate,
      request.endDate
    );

    // Step 2: Get fuel pricing
    const gasPrices = await getGasPrices(request.origin, request.destination);
    const evCharging = await getEVCharging(request.origin, request.destination);

    // Step 3: Use Bedrock Claude to plan the trip
    const itinerary = await planTripWithBedrock(request, weather, gasPrices, evCharging);

    // Step 4: Add booking links
    const itineraryWithLinks = await addBookingLinks(itinerary);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        itinerary: itineraryWithLinks,
        weather,
        fuelData: { gasPrices, evCharging }
      })
    };
  } catch (error) {
    console.error('Error planning trip:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to plan trip' })
    };
  }
};

async function planTripWithBedrock(
  request: TripPlanRequest,
  weather: any,
  gasPrices: any,
  evCharging: any
): Promise<Itinerary> {
  const prompt = `Plan a ${request.tripType} road trip from ${request.origin.name} to ${request.destination.name}.

Trip Details:
- Dates: ${request.startDate} to ${request.endDate}
- Participants: ${request.participants || 1}
- Budget: ${request.preferences.budget ? `$${request.preferences.budget}/day` : 'Flexible'}
- Pace: ${request.preferences.pace || 'moderate'}
- Interests: ${request.preferences.interests?.join(', ') || 'General sightseeing'}

Weather Forecast:
${JSON.stringify(weather, null, 2)}

Fuel Information:
Gas Prices: ${JSON.stringify(gasPrices, null, 2)}
EV Charging: ${JSON.stringify(evCharging, null, 2)}

Create a detailed day-by-day itinerary with:
1. Route optimization (scenic vs. fast)
2. Recommended stops (meals, attractions, rest breaks)
3. Accommodation suggestions for each night
4. Activity recommendations
5. Estimated costs
6. Travel times between stops

Format your response as structured JSON with this schema:
{
  "overview": "Brief trip summary",
  "totalDistance": number (miles),
  "totalDuration": number (hours),
  "estimatedCost": number,
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "items": [
        {
          "type": "drive" | "meal" | "activity" | "accommodation",
          "name": "string",
          "location": { "lat": number, "lng": number, "address": "string" },
          "startTime": "HH:MM",
          "duration": number (minutes),
          "cost": number,
          "description": "string",
          "notes": "string"
        }
      ]
    }
  ]
}`;

  const response = await bedrockService.planWithOpus(
    [{ role: 'user', content: prompt }],
    undefined,
    4000
  );

  // Extract JSON from response
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try parsing the whole response if no code block
  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}

async function addBookingLinks(itinerary: Itinerary): Promise<Itinerary> {
  // Add booking links to accommodation items
  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    for (const item of day.items) {
      if (item.type === 'accommodation') {
        const nextDay = itinerary.days[i + 1];
        item.bookingLinks = await generateBookingLinks(
          item.location.address,
          day.date,
          nextDay?.date
        );
      }
    }
  }

  return itinerary;
}
