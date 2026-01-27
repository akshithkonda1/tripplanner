import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';

const httpClient = axios.create({
  baseURL: API_CONFIG.HTTP_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface TripRequest {
  tripName: string;
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  startDate: string;
  endDate: string;
  tripType: 'family' | 'couple' | 'solo';
  preferences?: {
    budget?: number;
    interests?: string[];
    pace?: 'relaxed' | 'moderate' | 'fast';
    dietary?: string[];
  };
}

export interface Trip {
  tripId: string;
  tripName: string;
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  participants: string[];
}

export interface Itinerary {
  overview: string;
  totalDistance: number;
  totalDuration: number;
  estimatedCost: number;
  days: Day[];
}

export interface Day {
  day: number;
  date: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
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
  bookingLinks?: Record<string, string>;
}

export const api = {
  // Create new trip
  createTrip: async (data: TripRequest): Promise<Trip> => {
    const response = await httpClient.post(ENDPOINTS.TRIPS, data);
    return response.data.trip;
  },

  // Get trip details
  getTrip: async (tripId: string): Promise<Trip> => {
    const response = await httpClient.get(ENDPOINTS.GET_TRIP(tripId));
    return response.data.trip;
  },

  // Plan trip with AI
  planTrip: async (tripId: string, data: TripRequest): Promise<Itinerary> => {
    const response = await httpClient.post(ENDPOINTS.PLAN_TRIP(tripId), data);
    return response.data.itinerary;
  },

  // Get user's trips
  getUserTrips: async (): Promise<Trip[]> => {
    const response = await httpClient.get(ENDPOINTS.TRIPS);
    return response.data.trips;
  },

  // Add participant to trip
  addParticipant: async (tripId: string, userId: string): Promise<void> => {
    await httpClient.post(ENDPOINTS.ADD_PARTICIPANT(tripId), { userId });
  }
};
