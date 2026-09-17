export type HackTag =
  | 'nearby_airport'
  | 'flex_dates'
  | 'midweek'
  | 'one_way_pair'
  | 'open_jaw'
  | 'hidden_city'
  | 'package_combo'
  | 'split_rooms'
  | 'apartment';

export const HIDDEN_CITY_WARNING =
  'Hidden-city / skiplag: no checked bags through. Skipping the last segment can void the rest of the ticket (including the return) and may violate the airline contract of carriage. Trippy only ranks the published fare — payment still happens on Booking.com.';

export interface StayListing {
  id: string;
  name: string;
  city: string;
  provider: string;
  stars: number;
  guestRating: number;
  totalPrice: number;
  nights: number;
  currency: string;
  checkoutUrl: string;
  photoUrl?: string;
  rooms: number;
  propertyType: 'hotel' | 'hostel' | 'apartment' | 'camp';
  hackTags: HackTag[];
  warning?: string;
  comboTotal?: number;
}

export interface FlightListing {
  id: string;
  provider: string;
  from: string;
  to: string;
  via?: string;
  actualGetOff?: string;
  departDate: string;
  returnDate?: string;
  totalPrice: number;
  currency: string;
  isOneWay: boolean;
  stops: number;
  checkoutUrl: string;
  hackTags: HackTag[];
  warning?: string;
  comboTotal?: number;
  cabin: string;
}

export interface RankedStay extends StayListing {
  nightly: number;
  perPersonNight: number;
  quality: number;
  fairNightly: number;
  trippyValue: number;
}

export interface RankedFlight extends FlightListing {
  perPerson: number;
  quality: number;
  fairTotal: number;
  trippyValue: number;
}

export interface RankedStaySearch {
  source: 'booking.com' | 'fixture';
  partySize: number;
  nights: number;
  bestValue: RankedStay[];
  lowestTotal: RankedStay[];
  travelHacks: RankedStay[];
}

export interface RankedFlightSearch {
  source: 'booking.com' | 'fixture';
  partySize: number;
  bestValue: RankedFlight[];
  lowestTotal: RankedFlight[];
  travelHacks: RankedFlight[];
}

export const DEFAULT_STAY_BASELINE = 150;
export const DEFAULT_FLIGHT_BASELINE = 400;
