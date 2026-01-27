import axios from 'axios';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteResponse {
  distance: number; // miles
  duration: number; // minutes
  polyline: string;
  steps: RouteStep[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
}

interface Place {
  name: string;
  address: string;
  coordinates: Coordinates;
  type: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
}

// Note: We're using Apple Maps in the mobile app (free)
// This service is for server-side route calculations if needed
// Alternative: Use OpenStreetMap/GraphHopper (free) or Google Maps API

export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  waypoints?: Coordinates[]
): Promise<RouteResponse> {
  // Using GraphHopper API (free tier available)
  // Alternative: OSRM (completely free, self-hosted option)

  try {
    const points = [
      origin,
      ...(waypoints || []),
      destination
    ];

    const response = await axios.get('https://graphhopper.com/api/1/route', {
      params: {
        key: process.env.GRAPHHOPPER_API_KEY || 'demo',
        points: points.map(p => `${p.lat},${p.lng}`).join('|'),
        vehicle: 'car',
        locale: 'en',
        instructions: true,
        points_encoded: false
      }
    });

    const path = response.data.paths[0];

    return {
      distance: path.distance / 1609.34, // Convert meters to miles
      duration: path.time / 60000, // Convert milliseconds to minutes
      polyline: encodePolyline(path.points.coordinates),
      steps: path.instructions.map((step: any) => ({
        instruction: step.text,
        distance: step.distance / 1609.34,
        duration: step.time / 60000,
        startLocation: {
          lat: step.points[0][1],
          lng: step.points[0][0]
        },
        endLocation: {
          lat: step.points[1][1],
          lng: step.points[1][0]
        }
      }))
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    // Return straight-line estimate as fallback
    return getStraightLineRoute(origin, destination);
  }
}

export async function findPlacesNearRoute(
  route: Coordinates[],
  type: 'restaurant' | 'gas_station' | 'hotel' | 'attraction',
  radius: number = 5 // miles
): Promise<Place[]> {
  // Sample points along route
  const samplePoints = sampleRoute(route, 50); // Every 50 miles

  const places: Place[] = [];

  // Using Overpass API (OpenStreetMap) - completely free
  for (const point of samplePoints) {
    try {
      const osmType = mapTypeToOSM(type);
      const query = buildOverpassQuery(point, radius * 1609.34, osmType); // Convert miles to meters

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        { headers: { 'Content-Type': 'text/plain' } }
      );

      const osmPlaces = response.data.elements.map((element: any) => ({
        name: element.tags?.name || 'Unnamed',
        address: formatOSMAddress(element.tags),
        coordinates: {
          lat: element.lat || element.center?.lat,
          lng: element.lon || element.center?.lon
        },
        type: element.tags?.amenity || element.tags?.tourism,
        rating: undefined,
        priceLevel: undefined
      }));

      places.push(...osmPlaces);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    }
  }

  return places.slice(0, 20); // Return top 20
}

function encodePolyline(coordinates: number[][]): string {
  // Simplified polyline encoding
  // In production, use proper polyline encoding library
  return coordinates.map(c => `${c[1]},${c[0]}`).join('|');
}

function getStraightLineRoute(
  origin: Coordinates,
  destination: Coordinates
): RouteResponse {
  const distance = haversineDistance(origin, destination);
  const duration = (distance / 60) * 60; // Assume 60 mph average

  return {
    distance,
    duration,
    polyline: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
    steps: [{
      instruction: `Drive from origin to destination`,
      distance,
      duration,
      startLocation: origin,
      endLocation: destination
    }]
  };
}

function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function sampleRoute(route: Coordinates[], intervalMiles: number): Coordinates[] {
  // Sample points approximately every intervalMiles
  const samples: Coordinates[] = [route[0]];
  let accumulatedDistance = 0;

  for (let i = 1; i < route.length; i++) {
    const segmentDistance = haversineDistance(route[i - 1], route[i]);
    accumulatedDistance += segmentDistance;

    if (accumulatedDistance >= intervalMiles) {
      samples.push(route[i]);
      accumulatedDistance = 0;
    }
  }

  samples.push(route[route.length - 1]);
  return samples;
}

function mapTypeToOSM(type: string): string {
  const mapping: Record<string, string> = {
    'restaurant': 'amenity=restaurant',
    'gas_station': 'amenity=fuel',
    'hotel': 'tourism=hotel',
    'attraction': 'tourism=attraction'
  };
  return mapping[type] || 'amenity=restaurant';
}

function buildOverpassQuery(
  center: Coordinates,
  radius: number,
  osmType: string
): string {
  return `
    [out:json];
    (
      node[${osmType}](around:${radius},${center.lat},${center.lng});
      way[${osmType}](around:${radius},${center.lat},${center.lng});
    );
    out center;
  `;
}

function formatOSMAddress(tags: any): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode']
  ].filter(Boolean);

  return parts.join(', ') || 'Address not available';
}
