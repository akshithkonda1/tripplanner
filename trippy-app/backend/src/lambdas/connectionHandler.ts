import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const connectHandler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { tripId, userId } = event.queryStringParameters || {};

  if (!tripId || !userId) {
    return { statusCode: 400, body: 'Missing tripId or userId' };
  }

  try {
    await docClient.send(new PutCommand({
      TableName: process.env.CONNECTIONS_TABLE!,
      Item: {
        connectionId,
        tripId,
        userId,
        connectedAt: Date.now()
      }
    }));

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Connection error:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};

export const disconnectHandler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.CONNECTIONS_TABLE!,
      Key: { connectionId }
    }));

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Disconnection error:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
