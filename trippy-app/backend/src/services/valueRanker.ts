import {
  DEFAULT_FLIGHT_BASELINE,
  DEFAULT_STAY_BASELINE,
  FlightListing,
  RankedFlight,
  RankedStay,
  StayListing
} from './listings';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Booking.com stars + guest score → 0–1 quality. */
export function stayQuality(stars: number, guestRating: number): number {
  const star = clamp(stars, 0, 5) / 5;
  const guest = clamp(guestRating, 0, 10) / 10;
  return Math.max(0.05, 0.65 * star + 0.35 * guest);
}

export function gradeStay(
  listing: StayListing,
  partySize: number,
  cityBaseline = DEFAULT_STAY_BASELINE
): RankedStay {
  const nights = Math.max(1, listing.nights);
  const party = Math.max(1, partySize);
  const total = Math.max(listing.totalPrice, 0.01);
  const nightly = total / nights;
  const perPersonNight = total / (nights * party);
  const quality = stayQuality(listing.stars, listing.guestRating);
  const fairNightly = cityBaseline * (0.45 + 0.55 * quality);
  const trippyValue = (quality / perPersonNight) * (fairNightly / nightly);

  return {
    ...listing,
    nights,
    nightly,
    perPersonNight,
    quality,
    fairNightly,
    trippyValue
  };
}

export function gradeFlight(
  listing: FlightListing,
  partySize: number,
  fareBaseline = DEFAULT_FLIGHT_BASELINE
): RankedFlight {
  const party = Math.max(1, partySize);
  const total = Math.max(listing.totalPrice, 0.01);
  const perPerson = total / party;
  let quality = listing.stops === 0 ? 1 : listing.stops === 1 ? 0.88 : 0.75;
  if (listing.hackTags.includes('hidden_city')) quality = Math.min(quality, 0.72);
  const fairTotal = fareBaseline * party * quality;
  const trippyValue = (quality / perPerson) * (fairTotal / total);

  return {
    ...listing,
    perPerson,
    quality,
    fairTotal,
    trippyValue
  };
}

export function sortByValue<T extends { trippyValue: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.trippyValue - a.trippyValue);
}

export function sortByTotal<T extends { totalPrice: number; comboTotal?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => effectiveTotal(a) - effectiveTotal(b));
}

export function effectiveTotal(item: { totalPrice: number; comboTotal?: number }): number {
  return item.comboTotal ?? item.totalPrice;
}

export function hackOnly<T extends { hackTags: string[] }>(items: T[]): T[] {
  return items.filter((item) => item.hackTags.length > 0);
}

export function rankStays(
  listings: StayListing[],
  partySize: number,
  cityBaseline = DEFAULT_STAY_BASELINE
): RankedStay[] {
  return sortByValue(listings.map((listing) => gradeStay(listing, partySize, cityBaseline)));
}

export function rankFlights(
  listings: FlightListing[],
  partySize: number,
  fareBaseline = DEFAULT_FLIGHT_BASELINE
): RankedFlight[] {
  return sortByValue(listings.map((listing) => gradeFlight(listing, partySize, fareBaseline)));
}

export function staySearchResult(
  listings: StayListing[],
  partySize: number,
  source: 'booking.com' | 'fixture',
  nights: number,
  cityBaseline = DEFAULT_STAY_BASELINE
) {
  const ranked = listings.map((listing) => gradeStay(listing, partySize, cityBaseline));
  return {
    source,
    partySize,
    nights,
    bestValue: sortByValue(ranked),
    lowestTotal: sortByTotal(ranked),
    travelHacks: sortByValue(hackOnly(ranked))
  };
}

export function flightSearchResult(
  listings: FlightListing[],
  partySize: number,
  source: 'booking.com' | 'fixture',
  fareBaseline = DEFAULT_FLIGHT_BASELINE
) {
  const ranked = listings.map((listing) => gradeFlight(listing, partySize, fareBaseline));
  return {
    source,
    partySize,
    bestValue: sortByValue(ranked),
    lowestTotal: sortByTotal(ranked),
    travelHacks: sortByValue(hackOnly(ranked))
  };
}
