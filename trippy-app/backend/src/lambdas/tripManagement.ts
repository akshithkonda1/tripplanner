import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Create new trip
export const createTrip: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const tripId = uuidv4();
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';

    const travelMode = normalizeTravelMode(body.travelMode);

    const trip = {
      PK: `TRIP#${tripId}`,
      SK: 'METADATA',
      tripId,
      tripName: body.tripName,
      travelMode,
      origin: body.origin,
      destination: body.destination,
      legs: Array.isArray(body.legs) ? body.legs : [],
      startDate: body.startDate,
      endDate: body.endDate,
      datesFlexible: Boolean(body.datesFlexible) && travelMode !== 'road',
      tripType: body.tripType || 'solo',
      homeCurrency: body.homeCurrency || 'USD',
      status: 'planning',
      createdBy: userId,
      userId,
      participants: [userId],
      preferences: body.preferences || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TRIPS_TABLE!,
      Item: trip
    }));

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({ success: true, trip })
    };
  } catch (error) {
    console.error('Failed to create trip:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to create trip' })
    };
  }
};

// Get trip details
export const getTrip: APIGatewayProxyHandler = async (event) => {
  try {
    const tripId = event.pathParameters?.tripId;
    if (!tripId) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Missing tripId' })
      };
    }

    const result = await docClient.send(new GetCommand({
      TableName: process.env.TRIPS_TABLE!,
      Key: {
        PK: `TRIP#${tripId}`,
        SK: 'METADATA'
      }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Trip not found' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ trip: result.Item })
    };
  } catch (error) {
    console.error('Failed to get trip:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to get trip' })
    };
  }
};

// Get user's trips
export const getUserTrips: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';

    const result = await docClient.send(new QueryCommand({
      TableName: process.env.TRIPS_TABLE!,
      IndexName: 'UserTripsIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ trips: result.Items || [] })
    };
  } catch (error) {
    console.error('Failed to get user trips:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to get trips' })
    };
  }
};

// Add participant to trip
export const addParticipant: APIGatewayProxyHandler = async (event) => {
  try {
    const tripId = event.pathParameters?.tripId;
    const body = JSON.parse(event.body || '{}');
    const newParticipantId = body.userId;

    if (!tripId || !newParticipantId) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Missing tripId or userId' })
      };
    }

    await docClient.send(new UpdateCommand({
      TableName: process.env.TRIPS_TABLE!,
      Key: {
        PK: `TRIP#${tripId}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET participants = list_append(if_not_exists(participants, :empty_list), :new_participant)',
      ExpressionAttributeValues: {
        ':new_participant': [newParticipantId],
        ':empty_list': []
      }
    }));

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Failed to add participant:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to add participant' })
    };
  }
};

function normalizeTravelMode(value: unknown): 'road' | 'flight' | 'hybrid' {
  if (value === 'flight' || value === 'hybrid' || value === 'road') {
    return value;
  }
  return 'road';
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };
}
