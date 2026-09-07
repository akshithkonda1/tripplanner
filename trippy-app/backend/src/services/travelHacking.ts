export interface FlightHack {
  id: string;
  provider: string;
  title: string;
  why: string;
  url: string;
  isBooking: boolean;
}

interface Airport {
  iata: string;
  city: string;
  lat: number;
  lng: number;
}

/** Enough airports to prove nearby-airport and city-name hacks in tests. */
const AIRPORTS: Airport[] = [
  { iata: 'SFO', city: 'San Francisco', lat: 37.6213, lng: -122.379 },
  { iata: 'OAK', city: 'Oakland', lat: 37.7126, lng: -122.2197 },
  { iata: 'SJC', city: 'San Jose', lat: 37.3639, lng: -121.9289 },
  { iata: 'JFK', city: 'New York', lat: 40.6413, lng: -73.7781 },
  { iata: 'EWR', city: 'Newark', lat: 40.6895, lng: -74.1745 },
  { iata: 'LGA', city: 'New York', lat: 40.7769, lng: -73.874 },
  { iata: 'LHR', city: 'London', lat: 51.47, lng: -0.4543 },
  { iata: 'LGW', city: 'London', lat: 51.1537, lng: -0.1821 },
  { iata: 'STN', city: 'London', lat: 51.886, lng: 0.2389 },
  { iata: 'LIS', city: 'Lisbon', lat: 38.7742, lng: -9.1342 },
  { iata: 'HND', city: 'Tokyo', lat: 35.5494, lng: 139.7798 },
  { iata: 'NRT', city: 'Tokyo', lat: 35.772, lng: 140.3929 }
];

function haversineMiles(a: Airport, b: Airport): number {
  const r = 3958.8;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const dLam = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dPhi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLam / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function resolveAirport(query: string): Airport | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  const q = trimmed.toUpperCase();
  const exact = AIRPORTS.find((a) => a.iata === q);
  if (exact) return exact;

  const tokens = trimmed.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (tokens[0] && tokens[0].length === 3) {
    const byIata = AIRPORTS.find((a) => a.iata === tokens[0].toUpperCase());
    if (byIata) return byIata;
  }

  const cityHint = trimmed.split(',')[0].trim();
  return (
    AIRPORTS.find((a) => a.city.toUpperCase() === cityHint.toUpperCase()) ||
    AIRPORTS.find(
      (a) =>
        a.city.toUpperCase().includes(cityHint.toUpperCase()) ||
        cityHint.toUpperCase().includes(a.iata) ||
        q.includes(a.iata)
    )
  );
}

export function nearbyAirports(airport: Airport, withinMiles = 90): Airport[] {
  return AIRPORTS.filter((other) => other.iata !== airport.iata && haversineMiles(airport, other) <= withinMiles).sort(
    (x, y) => haversineMiles(airport, x) - haversineMiles(airport, y)
  );
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function compact(isoDate: string): string {
  return isoDate.replace(/-/g, '').slice(-6);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** weekday: 0 Sunday … 6 Saturday (Date#getUTCDay). */
function shiftToWeekday(date: Date, weekday: number): Date {
  const current = date.getUTCDay();
  const delta = (weekday - current + 7) % 7;
  return addDays(date, delta);
}

function bookingUrl(from: string, to: string, depart: Date, back?: Date): string {
  const type = back ? 'ROUNDTRIP' : 'ONEWAY';
  let url = `https://flights.booking.com/flights/${from}.AIRPORT-${to}.AIRPORT/?type=${type}&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=${iso(depart)}`;
  if (back) url += `&return=${iso(back)}`;
  return url;
}

function bookingOpenJaw(
  outFrom: string,
  outTo: string,
  homeFrom: string,
  homeTo: string,
  depart: Date,
  back: Date
): string {
  return `https://flights.booking.com/flights/${outFrom}.AIRPORT-${outTo}.AIRPORT/${homeFrom}.AIRPORT-${homeTo}.AIRPORT/?type=MULTISTOP&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=${iso(depart)}&return=${iso(back)}`;
}

function otherSites(from: string, to: string, depart: Date, back?: Date): FlightHack[] {
  const d = iso(depart);
  const r = back ? iso(back) : undefined;
  const kayak = r
    ? `https://www.kayak.com/flights/${from}-${to}/${d}/${r}?sort=price_a`
    : `https://www.kayak.com/flights/${from}-${to}/${d}?sort=price_a`;
  const google = r
    ? `https://www.google.com/travel/flights?q=Flights%20from%20${from}%20to%20${to}%20on%20${d}%20through%20${r}`
    : `https://www.google.com/travel/flights?q=Flights%20from%20${from}%20to%20${to}%20on%20${d}`;
  const skyscanner = r
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${compact(d)}/${compact(r)}/?adultsv2=1&cabinclass=economy&sort=price`
    : `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${compact(d)}/?adultsv2=1&cabinclass=economy&sort=price`;
  const momondo = r
    ? `https://www.momondo.com/flight-search/${from}-${to}/${d}/${r}?sort=price`
    : `https://www.momondo.com/flight-search/${from}-${to}/${d}?sort=price`;

  return [
    {
      id: 'kayak',
      provider: 'Kayak',
      title: 'Kayak · cheapest',
      why: 'After Booking.com — another full catalog, price sort.',
      url: kayak,
      isBooking: false
    },
    {
      id: 'google',
      provider: 'Google Flights',
      title: 'Google Flights · price grid',
      why: 'See the calendar of cheap days, then jump back to Booking.com to book.',
      url: google,
      isBooking: false
    },
    {
      id: 'skyscanner',
      provider: 'Skyscanner',
      title: 'Skyscanner · everywhere-style',
      why: 'Good for catching a budget airline Booking.com sometimes buries.',
      url: skyscanner,
      isBooking: false
    },
    {
      id: 'momondo',
      provider: 'Momondo',
      title: 'Momondo · cheapest',
      why: 'Last pass for a fare the others hid.',
      url: momondo,
      isBooking: false
    }
  ];
}

/**
 * Travel-hacking searches. Booking.com first, cheapest sort.
 * Nearby airports, flex dates, midweek, one-ways, open-jaw.
 * No hidden-city / skiplagging. No scraping — these are consumer deep links.
 */
export function cheapFlightHacks(
  originQuery: string,
  destQuery: string,
  departIso: string,
  returnIso?: string
): FlightHack[] {
  const origin = resolveAirport(originQuery);
  const dest = resolveAirport(destQuery);
  const from = origin?.iata || originQuery.trim().slice(0, 3).toUpperCase();
  const to = dest?.iata || destQuery.trim().slice(0, 3).toUpperCase();
  if (from.length !== 3 || to.length !== 3) return [];

  const depart = new Date(`${departIso}T00:00:00Z`);
  const back = returnIso ? new Date(`${returnIso}T00:00:00Z`) : undefined;

  const hacks: FlightHack[] = [
    {
      id: 'booking-exact',
      provider: 'Booking.com',
      title: `Booking.com · ${from} → ${to}`,
      why: back
        ? 'Exact dates, sorted cheapest. Most flight inventory we open first.'
        : 'One-way, sorted cheapest. We open Booking.com first.',
      url: bookingUrl(from, to, depart, back),
      isBooking: true
    }
  ];

  if (origin) {
    for (const alt of nearbyAirports(origin).slice(0, 2)) {
      hacks.push({
        id: `booking-alt-origin-${alt.iata}`,
        provider: 'Booking.com',
        title: `Booking.com · leave from ${alt.iata} (${alt.city})`,
        why: `Nearby origin — sometimes much cheaper than ${from}.`,
        url: bookingUrl(alt.iata, to, depart, back),
        isBooking: true
      });
    }
  }

  if (dest) {
    for (const alt of nearbyAirports(dest).slice(0, 2)) {
      hacks.push({
        id: `booking-alt-dest-${alt.iata}`,
        provider: 'Booking.com',
        title: `Booking.com · fly into ${alt.iata} (${alt.city})`,
        why: 'Nearby arrival — same city, often a cheaper airport.',
        url: bookingUrl(from, alt.iata, depart, back),
        isBooking: true
      });
    }
  }

  hacks.push({
    id: 'booking-flex',
    provider: 'Booking.com',
    title: 'Booking.com · ±3 days',
    why: 'Flexible window. The cheapest seat is rarely the first date you picked.',
    url: bookingUrl(from, to, addDays(depart, -3), back ? addDays(back, 3) : undefined),
    isBooking: true
  });

  hacks.push({
    id: 'booking-midweek',
    provider: 'Booking.com',
    title: 'Booking.com · midweek',
    why: 'Tue/Wed departures are often the cheapest days to fly.',
    url: bookingUrl(from, to, shiftToWeekday(depart, 2), back ? shiftToWeekday(back, 3) : undefined),
    isBooking: true
  });

  if (back) {
    hacks.push({
      id: 'booking-ow-out',
      provider: 'Booking.com',
      title: 'Booking.com · one-way out',
      why: 'Two one-ways can beat a round-trip on budget airlines.',
      url: bookingUrl(from, to, depart),
      isBooking: true
    });
    hacks.push({
      id: 'booking-ow-home',
      provider: 'Booking.com',
      title: 'Booking.com · one-way home',
      why: 'Pair with the outbound one-way and add the two prices.',
      url: bookingUrl(to, from, back),
      isBooking: true
    });

    const destAlt = dest ? nearbyAirports(dest)[0] : undefined;
    if (destAlt) {
      hacks.push({
        id: 'booking-openjaw',
        provider: 'Booking.com',
        title: `Booking.com · open-jaw via ${destAlt.iata}`,
        why: `Fly into ${to}, home from ${destAlt.iata}. Classic cheap-city trick.`,
        url: bookingOpenJaw(from, to, destAlt.iata, from, depart, back),
        isBooking: true
      });
    }

    const originAlt = origin ? nearbyAirports(origin)[0] : undefined;
    if (originAlt) {
      hacks.push({
        id: 'booking-return-nearby',
        provider: 'Booking.com',
        title: `Booking.com · return to ${originAlt.iata}`,
        why: `Land at a nearby home airport — sometimes half the price of ${from}.`,
        url: bookingOpenJaw(from, to, to, originAlt.iata, depart, back),
        isBooking: true
      });
    }
  }

  hacks.push(...otherSites(from, to, depart, back));
  return hacks;
}
