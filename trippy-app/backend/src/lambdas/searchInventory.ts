import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { searchFlights, searchStays } from '../services/bookingInventory';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(body) };
}

async function loadTrip(tripId?: string) {
  if (!tripId || !process.env.TRIPS_TABLE) return undefined;
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.TRIPS_TABLE,
      Key: { PK: `TRIP#${tripId}`, SK: 'METADATA' }
    })
  );
  return result.Item;
}

function adultsFrom(trip: Record<string, unknown> | undefined, query?: string) {
  if (query) {
    const n = Number(query);
    if (Number.isFinite(n) && n >= 1) return Math.min(12, Math.floor(n));
  }
  const participants = trip?.participants;
  if (Array.isArray(participants) && participants.length > 0) return participants.length;
  return 1;
}

function placeName(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value && typeof (value as { name: unknown }).name === 'string') {
    return (value as { name: string }).name;
  }
  return '';
}

export const searchStaysHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const tripId = event.pathParameters?.tripId;
    const qs = event.queryStringParameters || {};
    const trip = await loadTrip(tripId);
    const city = qs.city || placeName(trip?.destination) || 'Lisbon';
    const checkIn = qs.checkIn || (trip?.startDate as string) || new Date().toISOString().slice(0, 10);
    const checkOut = qs.checkOut || (trip?.endDate as string) || checkIn;
    const adults = adultsFrom(trip, qs.adults);
    const result = await searchStays({ city, checkIn, checkOut, adults });
    return json(200, result);
  } catch (error) {
    console.error('Failed to search stays', error);
    return json(500, { error: 'Failed to search stays' });
  }
};

export const searchFlightsHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const tripId = event.pathParameters?.tripId;
    const qs = event.queryStringParameters || {};
    const trip = await loadTrip(tripId);
    const from = qs.from || placeName(trip?.origin) || 'SFO';
    const to = qs.to || placeName(trip?.destination) || 'LIS';
    const depart = qs.depart || (trip?.startDate as string) || new Date().toISOString().slice(0, 10);
    const returnDate = qs.returnDate || (trip?.endDate as string);
    const adults = adultsFrom(trip, qs.adults);
    const result = await searchFlights({ from, to, depart, returnDate, adults });
    return json(200, result);
  } catch (error) {
    console.error('Failed to search flights', error);
    return json(500, { error: 'Failed to search flights' });
  }
};
