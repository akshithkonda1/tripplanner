import {
  FlightListing,
  HIDDEN_CITY_WARNING,
  RankedFlightSearch,
  RankedStaySearch,
  StayListing
} from './listings';
import {
  addDays,
  bookingOpenJaw,
  bookingUrl,
  hiddenCityBeyond,
  iso,
  nearbyAirports,
  nightsBetween,
  resolveAirport,
  shiftToWeekday,
  tagFlightListing,
  tagStayListing
} from './travelHacking';
import { flightSearchResult, staySearchResult } from './valueRanker';

export interface StaySearchParams {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}

export interface FlightSearchParams {
  from: string;
  to: string;
  depart: string;
  returnDate?: string;
  adults: number;
}

function stayCheckout(city: string, slug: string, checkIn: string, checkOut: string, adults: number): string {
  const ss = encodeURIComponent(city);
  return `https://www.booking.com/searchresults.html?ss=${ss}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1&order=price#${slug}`;
}

export function fixtureStays(params: StaySearchParams): StayListing[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const adults = Math.max(1, params.adults);
  const city = params.city.trim() || 'Lisbon';
  const scale = nights / 3;
  const sameNightlyBlock = Math.round(1000 * scale);
  const raw: StayListing[] = [
    {
      id: 'stay-3star',
      name: `${city} 3-star`,
      city,
      provider: 'Booking.com',
      stars: 3,
      guestRating: 7.2,
      totalPrice: sameNightlyBlock,
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, '3star', params.checkIn, params.checkOut, adults),
      rooms: 1,
      propertyType: 'hotel',
      hackTags: []
    },
    {
      id: 'stay-5star',
      name: `${city} 5-star palace`,
      city,
      provider: 'Booking.com',
      stars: 5,
      guestRating: 9.1,
      totalPrice: sameNightlyBlock,
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, '5star', params.checkIn, params.checkOut, adults),
      rooms: 1,
      propertyType: 'hotel',
      hackTags: []
    },
    {
      id: 'stay-hostel',
      name: `${city} hostel dorm`,
      city,
      provider: 'Booking.com',
      stars: 3,
      guestRating: 8.4,
      totalPrice: Math.round(40 * nights),
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, 'hostel', params.checkIn, params.checkOut, adults),
      rooms: 1,
      propertyType: 'hostel',
      hackTags: []
    },
    {
      id: 'stay-apt',
      name: `${city} 2-bed apartment`,
      city,
      provider: 'Booking.com',
      stars: 4,
      guestRating: 8.8,
      totalPrice: Math.round(180 * nights),
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, 'apt', params.checkIn, params.checkOut, adults),
      rooms: 2,
      propertyType: 'apartment',
      hackTags: ['apartment']
    },
    {
      id: 'stay-split',
      name: `${city} two hotel rooms`,
      city,
      provider: 'Booking.com',
      stars: 3,
      guestRating: 7.5,
      totalPrice: Math.round(220 * nights),
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, 'tworooms', params.checkIn, params.checkOut, adults),
      rooms: 2,
      propertyType: 'hotel',
      hackTags: ['split_rooms']
    },
    {
      id: 'stay-package',
      name: `${city} flight + hotel package`,
      city,
      provider: 'Booking.com',
      stars: 4,
      guestRating: 8.2,
      totalPrice: Math.round(760 * scale),
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, 'package', params.checkIn, params.checkOut, adults),
      rooms: 1,
      propertyType: 'hotel',
      hackTags: ['package_combo'],
      comboTotal: Math.round(760 * scale)
    },
    {
      id: 'stay-camp',
      name: `Camp near ${city}`,
      city,
      provider: 'Booking.com',
      stars: 1,
      guestRating: 8.0,
      totalPrice: Math.round(18 * nights),
      nights,
      currency: 'USD',
      checkoutUrl: stayCheckout(city, 'camp', params.checkIn, params.checkOut, adults),
      rooms: 1,
      propertyType: 'camp',
      hackTags: []
    }
  ];
  return raw.map((listing) => tagStayListing(listing, adults));
}

export function fixtureFlights(params: FlightSearchParams): FlightListing[] {
  const origin = resolveAirport(params.from);
  const dest = resolveAirport(params.to);
  const from = origin?.iata || params.from.trim().slice(0, 3).toUpperCase();
  const to = dest?.iata || params.to.trim().slice(0, 3).toUpperCase();
  if (from.length !== 3 || to.length !== 3) return [];

  const depart = new Date(`${params.depart}T00:00:00Z`);
  const back = params.returnDate ? new Date(`${params.returnDate}T00:00:00Z`) : undefined;
  const adults = Math.max(1, params.adults);
  const published = 640 * adults;
  const listings: FlightListing[] = [
    {
      id: 'flight-exact',
      provider: 'Booking.com',
      from,
      to,
      departDate: params.depart,
      returnDate: params.returnDate,
      totalPrice: published,
      currency: 'USD',
      isOneWay: !back,
      stops: 0,
      checkoutUrl: bookingUrl(from, to, depart, back),
      hackTags: [],
      cabin: 'economy'
    }
  ];

  if (origin) {
    for (const alt of nearbyAirports(origin).slice(0, 2)) {
      listings.push({
        id: `flight-alt-origin-${alt.iata}`,
        provider: 'Booking.com',
        from: alt.iata,
        to,
        departDate: params.depart,
        returnDate: params.returnDate,
        totalPrice: Math.round(published * 0.78),
        currency: 'USD',
        isOneWay: !back,
        stops: 0,
        checkoutUrl: bookingUrl(alt.iata, to, depart, back),
        hackTags: ['nearby_airport'],
        cabin: 'economy'
      });
    }
  }

  if (dest) {
    for (const alt of nearbyAirports(dest).slice(0, 1)) {
      listings.push({
        id: `flight-alt-dest-${alt.iata}`,
        provider: 'Booking.com',
        from,
        to: alt.iata,
        departDate: params.depart,
        returnDate: params.returnDate,
        totalPrice: Math.round(published * 0.82),
        currency: 'USD',
        isOneWay: !back,
        stops: 0,
        checkoutUrl: bookingUrl(from, alt.iata, depart, back),
        hackTags: ['nearby_airport'],
        cabin: 'economy'
      });
    }
  }

  const flexOut = addDays(depart, -3);
  const flexBack = back ? addDays(back, 3) : undefined;
  listings.push({
    id: 'flight-flex',
    provider: 'Booking.com',
    from,
    to,
    departDate: iso(flexOut),
    returnDate: flexBack ? iso(flexBack) : undefined,
    totalPrice: Math.round(published * 0.71),
    currency: 'USD',
    isOneWay: !flexBack,
    stops: 0,
    checkoutUrl: bookingUrl(from, to, flexOut, flexBack),
    hackTags: ['flex_dates'],
    cabin: 'economy'
  });

  const midOut = shiftToWeekday(depart, 2);
  const midBack = back ? shiftToWeekday(back, 3) : undefined;
  listings.push({
    id: 'flight-midweek',
    provider: 'Booking.com',
    from,
    to,
    departDate: iso(midOut),
    returnDate: midBack ? iso(midBack) : undefined,
    totalPrice: Math.round(published * 0.74),
    currency: 'USD',
    isOneWay: !midBack,
    stops: 0,
    checkoutUrl: bookingUrl(from, to, midOut, midBack),
    hackTags: ['midweek'],
    cabin: 'economy'
  });

  if (back) {
    const oneWayOut = Math.round(published * 0.38);
    const oneWayHome = Math.round(published * 0.36);
    listings.push({
      id: 'flight-ow-pair',
      provider: 'Booking.com',
      from,
      to,
      departDate: params.depart,
      returnDate: params.returnDate,
      totalPrice: oneWayOut + oneWayHome,
      currency: 'USD',
      isOneWay: true,
      stops: 0,
      checkoutUrl: bookingUrl(from, to, depart),
      hackTags: ['one_way_pair'],
      comboTotal: oneWayOut + oneWayHome,
      cabin: 'economy'
    });

    const destAlt = dest ? nearbyAirports(dest)[0] : undefined;
    if (destAlt) {
      listings.push({
        id: 'flight-openjaw',
        provider: 'Booking.com',
        from,
        to,
        via: destAlt.iata,
        departDate: params.depart,
        returnDate: params.returnDate,
        totalPrice: Math.round(published * 0.8),
        currency: 'USD',
        isOneWay: false,
        stops: 0,
        checkoutUrl: bookingOpenJaw(from, to, destAlt.iata, from, depart, back),
        hackTags: ['open_jaw'],
        cabin: 'economy'
      });
    }
  }

  const beyond = hiddenCityBeyond(to);
  listings.push({
    id: 'flight-hidden-city',
    provider: 'Booking.com',
    from,
    to: beyond,
    via: to,
    actualGetOff: to,
    departDate: params.depart,
    returnDate: params.returnDate,
    totalPrice: Math.round(published * 0.58),
    currency: 'USD',
    isOneWay: !back,
    stops: 1,
    checkoutUrl: bookingUrl(from, beyond, depart, back),
    hackTags: ['hidden_city'],
    warning: HIDDEN_CITY_WARNING,
    cabin: 'economy'
  });

  const requested = {
    from,
    to,
    depart: params.depart,
    returnDate: params.returnDate
  };
  return listings.map((listing) => tagFlightListing(listing, requested));
}

interface DemandAccommodation {
  id?: string | number;
  name?: string;
  stars?: number;
  starRating?: number;
  guestRating?: number;
  reviewScore?: number;
  price?: { total?: number; currency?: string };
  totalPrice?: number;
  currency?: string;
  url?: string;
  deepLink?: string;
  propertyType?: string;
}

function mapDemandStays(payload: unknown, params: StaySearchParams): StayListing[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const root = payload as {
    accommodations?: DemandAccommodation[];
    data?: DemandAccommodation[];
    result?: DemandAccommodation[];
  };
  const rows = root.accommodations || root.data || root.result || [];
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.slice(0, 20).map((row, index) => {
    const total = row.price?.total ?? row.totalPrice ?? 0;
    const listing: StayListing = {
      id: String(row.id ?? `demand-${index}`),
      name: row.name || `${params.city} stay ${index + 1}`,
      city: params.city,
      provider: 'Booking.com',
      stars: row.stars ?? row.starRating ?? 3,
      guestRating: row.guestRating ?? row.reviewScore ?? 8,
      totalPrice: total,
      nights,
      currency: row.price?.currency || row.currency || 'USD',
      checkoutUrl:
        row.url ||
        row.deepLink ||
        stayCheckout(params.city, String(row.id ?? index), params.checkIn, params.checkOut, params.adults),
      rooms: 1,
      propertyType: /apart/i.test(row.propertyType || '')
        ? 'apartment'
        : /hostel/i.test(row.propertyType || '')
          ? 'hostel'
          : 'hotel',
      hackTags: []
    };
    return tagStayListing(listing, params.adults);
  });
}

async function fetchDemandStays(params: StaySearchParams, token: string): Promise<StayListing[]> {
  const response = await fetch('https://demandapi.booking.com/3.1/accommodations/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      city: params.city,
      checkin: params.checkIn,
      checkout: params.checkOut,
      booker: { country: 'us', platform: 'mobile' },
      guests: { number_of_rooms: 1, number_of_adults: params.adults }
    })
  });
  if (!response.ok) {
    throw new Error(`Booking.com Demand API ${response.status}`);
  }
  const json = await response.json();
  return mapDemandStays(json, params);
}

export async function searchStays(params: StaySearchParams): Promise<RankedStaySearch> {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const token = process.env.BOOKING_DEMAND_TOKEN;
  if (token) {
    try {
      const live = await fetchDemandStays(params, token);
      if (live.length > 0) {
        return staySearchResult(live, params.adults, 'booking.com', nights);
      }
    } catch (error) {
      console.error('Booking.com Demand API stays failed, using fixture catalog', error);
    }
  }
  return staySearchResult(fixtureStays(params), params.adults, 'fixture', nights);
}

export async function searchFlights(params: FlightSearchParams): Promise<RankedFlightSearch> {
  // Demand API covers accommodations. Flights use the same Booking.com checkout URLs
  // on a fixture catalog unless a flights token is added later.
  return flightSearchResult(fixtureFlights(params), params.adults, 'fixture');
}
