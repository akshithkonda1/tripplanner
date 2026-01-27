import axios from 'axios';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface GasStation {
  name: string;
  address: string;
  location: Location;
  prices: {
    regular: number;
    midgrade?: number;
    premium?: number;
    diesel?: number;
  };
  lastUpdated: string;
}

interface EVChargingStation {
  name: string;
  address: string;
  location: Location;
  network: string;
  connectors: Connector[];
  available: boolean;
  pricing: {
    perKwh?: number;
    perMinute?: number;
    sessionFee?: number;
  };
}

interface Connector {
  type: 'CCS' | 'CHAdeMO' | 'Tesla' | 'J1772';
  power: number; // kW
  available: boolean;
}

interface GasPricesResult {
  stations: GasStation[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
}

interface EVChargingResult {
  stations: EVChargingStation[];
  averagePricePerKwh: number;
}

const GASBUDDY_API_KEY = process.env.GASBUDDY_API_KEY;
const OPENCHARGEMAP_API_KEY = process.env.OPENCHARGEMAP_API_KEY;

export async function getGasPrices(
  origin: Location,
  destination: Location
): Promise<GasPricesResult> {
  try {
    // In production, this would call the GasBuddy API or similar
    // For now, return mock data
    const stations = await fetchGasStationsAlongRoute(origin, destination);

    const prices = stations.map(s => s.prices.regular);
    return {
      stations,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices)
    };
  } catch (error) {
    console.error('Failed to fetch gas prices:', error);
    return generateMockGasPrices(origin, destination);
  }
}

export async function getEVCharging(
  origin: Location,
  destination: Location
): Promise<EVChargingResult> {
  try {
    // OpenChargeMap API for EV charging stations
    const response = await axios.get('https://api.openchargemap.io/v3/poi', {
      params: {
        key: OPENCHARGEMAP_API_KEY,
        latitude: (origin.lat + destination.lat) / 2,
        longitude: (origin.lng + destination.lng) / 2,
        distance: 100, // miles
        distanceunit: 'miles',
        maxresults: 20,
        compact: true,
        verbose: false
      }
    });

    const stations: EVChargingStation[] = response.data.map((poi: any) => ({
      name: poi.AddressInfo?.Title || 'EV Charging Station',
      address: poi.AddressInfo?.AddressLine1 || '',
      location: {
        lat: poi.AddressInfo?.Latitude,
        lng: poi.AddressInfo?.Longitude
      },
      network: poi.OperatorInfo?.Title || 'Unknown',
      connectors: (poi.Connections || []).map((conn: any) => ({
        type: mapConnectorType(conn.ConnectionTypeID),
        power: conn.PowerKW || 0,
        available: true
      })),
      available: poi.StatusType?.IsOperational !== false,
      pricing: {
        perKwh: 0.35 // Default estimate
      }
    }));

    const prices = stations
      .map(s => s.pricing.perKwh)
      .filter((p): p is number => p !== undefined);

    return {
      stations,
      averagePricePerKwh: prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : 0.35
    };
  } catch (error) {
    console.error('Failed to fetch EV charging stations:', error);
    return generateMockEVCharging(origin, destination);
  }
}

async function fetchGasStationsAlongRoute(
  origin: Location,
  destination: Location
): Promise<GasStation[]> {
  // In production, this would use a routing API to find stations along the route
  // For now, generate mock stations
  return generateMockGasStations(origin, destination);
}

function mapConnectorType(typeId: number): 'CCS' | 'CHAdeMO' | 'Tesla' | 'J1772' {
  const mapping: Record<number, 'CCS' | 'CHAdeMO' | 'Tesla' | 'J1772'> = {
    1: 'J1772',
    2: 'CHAdeMO',
    25: 'Tesla',
    32: 'CCS',
    33: 'CCS'
  };
  return mapping[typeId] || 'J1772';
}

function generateMockGasStations(origin: Location, destination: Location): GasStation[] {
  const stations: GasStation[] = [];
  const numStations = 5;

  for (let i = 0; i < numStations; i++) {
    const ratio = i / (numStations - 1);
    const lat = origin.lat + (destination.lat - origin.lat) * ratio;
    const lng = origin.lng + (destination.lng - origin.lng) * ratio;

    stations.push({
      name: `Gas Station ${i + 1}`,
      address: `${1000 + i * 100} Highway 101`,
      location: { lat, lng },
      prices: {
        regular: 3.50 + Math.random() * 0.50,
        midgrade: 3.80 + Math.random() * 0.50,
        premium: 4.10 + Math.random() * 0.50,
        diesel: 4.00 + Math.random() * 0.50
      },
      lastUpdated: new Date().toISOString()
    });
  }

  return stations;
}

function generateMockGasPrices(origin: Location, destination: Location): GasPricesResult {
  const stations = generateMockGasStations(origin, destination);
  const prices = stations.map(s => s.prices.regular);

  return {
    stations,
    averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    lowestPrice: Math.min(...prices),
    highestPrice: Math.max(...prices)
  };
}

function generateMockEVCharging(origin: Location, destination: Location): EVChargingResult {
  const stations: EVChargingStation[] = [];
  const numStations = 4;
  const networks = ['Tesla Supercharger', 'ChargePoint', 'Electrify America', 'EVgo'];

  for (let i = 0; i < numStations; i++) {
    const ratio = i / (numStations - 1);
    const lat = origin.lat + (destination.lat - origin.lat) * ratio;
    const lng = origin.lng + (destination.lng - origin.lng) * ratio;

    stations.push({
      name: `${networks[i]} Station`,
      address: `${2000 + i * 100} Electric Ave`,
      location: { lat, lng },
      network: networks[i],
      connectors: [
        { type: 'CCS', power: 150, available: true },
        { type: 'CHAdeMO', power: 50, available: true }
      ],
      available: true,
      pricing: {
        perKwh: 0.30 + Math.random() * 0.15
      }
    });
  }

  const prices = stations.map(s => s.pricing.perKwh!);

  return {
    stations,
    averagePricePerKwh: prices.reduce((a, b) => a + b, 0) / prices.length
  };
}
