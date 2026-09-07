// Multi-city flight planning that costs $0 in API fees.
//
// There is no free, reliable flight-price API, so instead of paying for one we
// generate deep links into the airlines' own free search UIs (Kayak, Google
// Flights, Skyscanner). Kayak's URL format supports true multi-city searches,
// so a whole itinerary (Home -> NYC -> LA -> Home) opens as one search.
//
// `from`/`to` are airport IATA codes (e.g. "JFK") or city names Kayak accepts.

export interface FlightLeg {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
}

export interface FlightLegLinks {
  leg: FlightLeg;
  links: Record<string, string>;
}

export interface FlightItinerary {
  legs: FlightLeg[];
  // Whole-trip multi-city searches (where the provider supports it).
  bookingLinks: Record<string, string>;
  // Per-leg one-way search links as a fallback / for price comparison.
  legLinks: FlightLegLinks[];
}

export function buildFlightItinerary(legs: FlightLeg[]): FlightItinerary {
  const normalized = legs
    .filter(l => l && l.from && l.to && l.date)
    .map(l => ({
      from: normalizeCode(l.from),
      to: normalizeCode(l.to),
      date: formatDate(l.date),
    }));

  if (normalized.length === 0) {
    throw new Error('buildFlightItinerary requires at least one valid leg');
  }

  return {
    legs: normalized,
    bookingLinks: {
      Kayak: kayakMultiCityUrl(normalized),
      'Google Flights': googleFlightsUrl(normalized),
    },
    legLinks: normalized.map(leg => ({
      leg,
      links: {
        Kayak: kayakOneWayUrl(leg),
        'Google Flights': googleFlightsLegUrl(leg),
        Skyscanner: skyscannerOneWayUrl(leg),
      },
    })),
  };
}

// https://www.kayak.com/flights/JFK-LAX/2024-07-01/LAX-DEN/2024-07-05?sort=price_a
function kayakMultiCityUrl(legs: FlightLeg[]): string {
  const path = legs.map(l => `${l.from}-${l.to}/${l.date}`).join('/');
  return `https://www.kayak.com/flights/${path}?sort=price_a`;
}

function kayakOneWayUrl(leg: FlightLeg): string {
  return `https://www.kayak.com/flights/${leg.from}-${leg.to}/${leg.date}?sort=price_a`;
}

function googleFlightsUrl(legs: FlightLeg[]): string {
  const summary = legs.map(l => `${l.from} to ${l.to} on ${l.date}`).join(', ');
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Multi-city flights: ${summary}`
  )}`;
}

function googleFlightsLegUrl(leg: FlightLeg): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Flights from ${leg.from} to ${leg.to} on ${leg.date}`
  )}`;
}

// Skyscanner uses lowercase codes and a YYMMDD date.
function skyscannerOneWayUrl(leg: FlightLeg): string {
  const yymmdd = leg.date.replace(/-/g, '').slice(2);
  return `https://www.skyscanner.com/transport/flights/${leg.from.toLowerCase()}/${leg.to.toLowerCase()}/${yymmdd}/`;
}

function normalizeCode(value: string): string {
  const trimmed = value.trim();
  // IATA codes are 3 letters; uppercase them. Otherwise keep the text as-is
  // (Kayak/Google accept city names too).
  return /^[A-Za-z]{3}$/.test(trimmed) ? trimmed.toUpperCase() : trimmed;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toISOString().split('T')[0];
}
