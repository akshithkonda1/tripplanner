import axios from 'axios';
import {API_CONFIG, ENDPOINTS} from '../config/api';

const httpClient = axios.create({
  baseURL: API_CONFIG.HTTP_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
  origin: any;
  destination: any;
  startDate: string;
  endDate: string;
  status: string;
  participants: string[];
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
  planTrip: async (tripId: string, data: any): Promise<any> => {
    const response = await httpClient.post(ENDPOINTS.PLAN_TRIP(tripId), data);
    return response.data.itinerary;
  },

  // Get user's trips
  getUserTrips: async (): Promise<Trip[]> => {
    const response = await httpClient.get(ENDPOINTS.TRIPS);
    return response.data.trips;
  },
};
