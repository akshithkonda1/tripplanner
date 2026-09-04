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

type TravelMode = 'road' | 'flight' | 'hybrid';

interface TripPlanRequest {
  origin: Location;
  destination: Location;
  startDate: string;
  endDate: string;
  tripType: 'family' | 'couple' | 'solo' | 'friends';
  travelMode?: TravelMode;
  datesFlexible?: boolean;
  legs?: Array<{ transport?: string; from?: { name?: string }; to?: { name?: string } }>;
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

    const travelMode = request.travelMode === 'flight' || request.travelMode === 'hybrid'
      ? request.travelMode
      : 'road';

    // Step 2: Fuel pricing only matters on drive legs
    const gasPrices = travelMode === 'flight'
      ? null
      : await getGasPrices(request.origin, request.destination);
    const evCharging = travelMode === 'flight'
      ? null
      : await getEVCharging(request.origin, request.destination);

    // Step 3: Use Bedrock Claude to plan the trip
    const itinerary = await planTripWithBedrock(request, weather, gasPrices, evCharging, travelMode);

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
  evCharging: any,
  travelMode: TravelMode
): Promise<Itinerary> {
  const modeInstructions = {
    road: `Plan a ${request.tripType} road trip from ${request.origin.name} to ${request.destination.name}.
Optimize the drive (scenic vs. fast), roadside meals, campsites/motels, fuel stops, and travel times.`,
    flight: `Plan a longer ${request.tripType} trip from ${request.origin.name} to ${request.destination.name} in Flight Mode.
Group the itinerary by city stay (nights in a place), not driving days. Prefer cheap fares, hostels, and local transit over rental cars.
${request.datesFlexible ? 'Dates are flexible by ±3 days — pick the cheaper window.' : ''}
Legs: ${JSON.stringify(request.legs || [])}`,
    hybrid: `Plan a hybrid ${request.tripType} trip from ${request.origin.name} to ${request.destination.name}.
Treat each leg by its transport type (fly, drive, train). Keep one shared budget. Mix flight arcs and driving days.`
  }[travelMode];

  const prompt = `${modeInstructions}

Trip Details:
- Travel mode: ${travelMode}
- Dates: ${request.startDate} to ${request.endDate}
- Participants: ${request.participants || 1}
- Budget: ${request.preferences.budget ? `$${request.preferences.budget}` : 'Shoestring / flexible'}
- Pace: ${request.preferences.pace || 'moderate'}
- Interests: ${request.preferences.interests?.join(', ') || 'General sightseeing'}

Weather Forecast:
${JSON.stringify(weather, null, 2)}

Fuel Information (ignore for pure flight trips):
Gas Prices: ${JSON.stringify(gasPrices, null, 2)}
EV Charging: ${JSON.stringify(evCharging, null, 2)}

Create a detailed day-by-day itinerary with:
1. Route or city-stay structure appropriate to the travel mode
2. Recommended stops (meals, attractions, rest / layover)
3. Accommodation suggestions for each night
4. Activity recommendations
5. Estimated costs (include flights when travelMode is flight or hybrid)
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
          "type": "drive" | "flight" | "meal" | "activity" | "accommodation" | "transit",
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
