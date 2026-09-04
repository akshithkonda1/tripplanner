import { createTrip, getTrip, getUserTrips, addParticipant } from '../lambdas/tripManagement';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Trip Management Lambda Functions', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TRIPS_TABLE = 'test-trips-table';
  });

  describe('createTrip', () => {
    it('should create a new trip successfully', async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = {
        body: JSON.stringify({
          tripName: 'Summer Road Trip',
          origin: { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
          destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
          startDate: '2024-07-01',
          endDate: '2024-07-10',
          tripType: 'family'
        }),
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' }
          }
        }
      } as any;

      const result = await createTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(201);
      const body = JSON.parse(result?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.trip.tripName).toBe('Summer Road Trip');
      expect(body.trip.tripType).toBe('family');
      expect(body.trip.travelMode).toBe('road');
      expect(body.trip.datesFlexible).toBe(false);
      expect(body.trip.legs).toEqual([]);
    });

    it('should persist flight mode and flexible dates', async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = {
        body: JSON.stringify({
          tripName: 'Two weeks in Japan',
          travelMode: 'flight',
          datesFlexible: true,
          origin: { lat: 37.62, lng: -122.37, name: 'SFO' },
          destination: { lat: 35.54, lng: 139.77, name: 'HND' },
          legs: [{ transport: 'flight', from: { name: 'SFO' }, to: { name: 'HND' } }],
          startDate: '2026-11-02',
          endDate: '2026-11-16',
          tripType: 'couple'
        }),
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' }
          }
        }
      } as any;

      const result = await createTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(201);
      const body = JSON.parse(result?.body || '{}');
      expect(body.trip.travelMode).toBe('flight');
      expect(body.trip.datesFlexible).toBe(true);
      expect(body.trip.legs).toHaveLength(1);
    });

    it('should treat unknown travelMode as road', async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = {
        body: JSON.stringify({
          tripName: 'Mystery trip',
          travelMode: 'teleport',
          origin: { lat: 0, lng: 0, name: 'A' },
          destination: { lat: 1, lng: 1, name: 'B' },
          startDate: '2026-01-01',
          endDate: '2026-01-02'
        }),
        requestContext: {}
      } as any;

      const result = await createTrip(event, {} as any, () => {});
      const body = JSON.parse(result?.body || '{}');
      expect(body.trip.travelMode).toBe('road');
    });

    it('should return 500 on database error', async () => {
      ddbMock.on(PutCommand).rejects(new Error('Database error'));

      const event = {
        body: JSON.stringify({
          tripName: 'Test Trip',
          origin: { lat: 0, lng: 0 },
          destination: { lat: 1, lng: 1 },
          startDate: '2024-01-01',
          endDate: '2024-01-02'
        }),
        requestContext: {}
      } as any;

      const result = await createTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(500);
      const body = JSON.parse(result?.body || '{}');
      expect(body.error).toBe('Failed to create trip');
    });
  });

  describe('getTrip', () => {
    it('should return trip details', async () => {
      const mockTrip = {
        PK: 'TRIP#trip-123',
        SK: 'METADATA',
        tripId: 'trip-123',
        tripName: 'Test Trip',
        status: 'planning'
      };

      ddbMock.on(GetCommand).resolves({ Item: mockTrip });

      const event = {
        pathParameters: { tripId: 'trip-123' }
      } as any;

      const result = await getTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body || '{}');
      expect(body.trip.tripId).toBe('trip-123');
    });

    it('should return 404 for non-existent trip', async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      const event = {
        pathParameters: { tripId: 'non-existent' }
      } as any;

      const result = await getTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(404);
    });

    it('should return 400 when tripId is missing', async () => {
      const event = {
        pathParameters: {}
      } as any;

      const result = await getTrip(event, {} as any, () => {});

      expect(result?.statusCode).toBe(400);
    });
  });

  describe('getUserTrips', () => {
    it('should return user trips', async () => {
      const mockTrips = [
        { tripId: 'trip-1', tripName: 'Trip 1' },
        { tripId: 'trip-2', tripName: 'Trip 2' }
      ];

      ddbMock.on(QueryCommand).resolves({ Items: mockTrips });

      const event = {
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' }
          }
        }
      } as any;

      const result = await getUserTrips(event, {} as any, () => {});

      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body || '{}');
      expect(body.trips).toHaveLength(2);
    });

    it('should return empty array when no trips', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const event = {
        requestContext: {}
      } as any;

      const result = await getUserTrips(event, {} as any, () => {});

      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body || '{}');
      expect(body.trips).toHaveLength(0);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to trip', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      const event = {
        pathParameters: { tripId: 'trip-123' },
        body: JSON.stringify({ userId: 'new-user-456' })
      } as any;

      const result = await addParticipant(event, {} as any, () => {});

      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body || '{}');
      expect(body.success).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      const event = {
        pathParameters: { tripId: 'trip-123' },
        body: JSON.stringify({})
      } as any;

      const result = await addParticipant(event, {} as any, () => {});

      expect(result?.statusCode).toBe(400);
    });
  });
});
