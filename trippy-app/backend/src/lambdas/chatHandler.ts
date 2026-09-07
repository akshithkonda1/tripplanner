import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { bedrockService } from '../services/bedrockService';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

interface ChatMessage {
  tripId: string;
  userId: string;
  message: string;
  timestamp: number;
}

interface TripContext {
  tripId: string;
  messages: any[];
  itinerary: any[];
  preferences: Record<string, any>;
}

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { connectionId, routeKey } = event.requestContext;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  // Initialize API Gateway Management API client
  const apigwManagementApi = new ApiGatewayManagementApiClient({
    endpoint: `https://${domain}/${stage}`
  });

  try {
    if (routeKey === '$connect') {
      return { statusCode: 200, body: 'Connected' };
    }

    if (routeKey === '$disconnect') {
      return { statusCode: 200, body: 'Disconnected' };
    }

    // Only $connect, $disconnect, and $default routes are configured on the
    // WebSocket API (see infrastructure/lib/backend-stack.ts), so every
    // client message lands here as '$default' regardless of its action field.
    if (routeKey === 'sendMessage' || routeKey === '$default') {
      const body: ChatMessage = JSON.parse(event.body || '{}');
      const { tripId, userId, message } = body;

      // Save message to DynamoDB
      await saveMessage(tripId, userId, message);

      // Load trip context
      const context = await loadTripContext(tripId);

      // Determine if we need planning (Opus) or chat (Sonnet)
      const needsPlanning = await determineIntent(message);

      let samResponse: string;

      if (needsPlanning) {
        // Use Bedrock Claude for complex planning
        samResponse = await claudeBedrockPlanning(message, context);
      } else {
        // Use Bedrock Claude Sonnet for quick chat
        samResponse = await claudeBedrockChat(message, context);
      }

      // Save Sam's response
      await saveMessage(tripId, 'SAM', samResponse);

      // Broadcast to all connections in this trip
      await broadcastToTrip(tripId, samResponse, apigwManagementApi);

      return { statusCode: 200, body: 'Message sent' };
    }

    return { statusCode: 400, body: 'Unsupported route' };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function saveMessage(tripId: string, userId: string, message: string) {
  const timestamp = Date.now();
  const messageId = uuidv4();

  await docClient.send(new PutCommand({
    TableName: process.env.MESSAGES_TABLE!,
    Item: {
      PK: `TRIP#${tripId}`,
      SK: `MSG#${timestamp}#${messageId}`,
      userId,
      message,
      timestamp,
      messageId
    }
  }));
}

async function loadTripContext(tripId: string): Promise<TripContext> {
  // Load recent messages
  const messagesResult = await docClient.send(new QueryCommand({
    TableName: process.env.MESSAGES_TABLE!,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `TRIP#${tripId}`
    },
    ScanIndexForward: false,
    Limit: 20
  }));

  // Load trip details
  const tripResult = await docClient.send(new QueryCommand({
    TableName: process.env.TRIPS_TABLE!,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `TRIP#${tripId}`,
      ':sk': 'METADATA'
    }
  }));

  // Load itinerary
  const itineraryResult = await docClient.send(new QueryCommand({
    TableName: process.env.ITINERARY_TABLE!,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TRIP#${tripId}`,
      ':sk': 'ITEM#'
    }
  }));

  return {
    tripId,
    messages: messagesResult.Items || [],
    itinerary: itineraryResult.Items || [],
    preferences: tripResult.Items?.[0]?.preferences || {}
  };
}

async function determineIntent(message: string): Promise<boolean> {
  // Simple keyword detection for now
  // Later: use Claude to classify intent
  const planningKeywords = [
    'plan', 'route', 'itinerary', 'optimize',
    'add stop', 'change', 'modify', 'rearrange'
  ];

  return planningKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
}

async function claudeBedrockChat(
  message: string,
  context: TripContext
): Promise<string> {
  const systemPrompt = buildChatSystemPrompt(context);
  const messages = [
    ...formatConversationHistory(context.messages),
    { role: 'user' as const, content: message },
  ];

  return bedrockService.chatWithSonnet(messages, systemPrompt, 1000);
}

async function claudeBedrockPlanning(
  message: string,
  context: TripContext
): Promise<string> {
  const systemPrompt = buildPlanningSystemPrompt(context);
  const messages = [
    ...formatConversationHistory(context.messages),
    { role: 'user' as const, content: message },
  ];

  return bedrockService.planWithOpus(messages, systemPrompt, 4000);
}

function buildChatSystemPrompt(context: TripContext): string {
  return `You are Sam, a friendly AI road trip planning assistant.

Current trip context:
- Trip ID: ${context.tripId}
- Current itinerary: ${JSON.stringify(context.itinerary, null, 2)}
- User preferences: ${JSON.stringify(context.preferences, null, 2)}

Your personality:
- Enthusiastic but not overwhelming
- Helpful and proactive
- Clear about trade-offs
- Remember conversation context

Respond naturally and conversationally. Keep responses concise for chat.`;
}

function buildPlanningSystemPrompt(context: TripContext): string {
  return `You are Sam, an expert road trip planning assistant.

You have access to:
- Weather forecasts
- Gas and EV charging prices
- Route optimization
- Accommodation options

Current trip:
${JSON.stringify(context, null, 2)}

Task: Create or modify the trip itinerary based on user request.

Return your response in this format:
1. A friendly message explaining what you're doing
2. The updated itinerary in structured format

Be specific about times, distances, and costs.`;
}

function formatConversationHistory(messages: any[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .reverse()
    .slice(0, 10) // Last 10 messages
    .map(msg => ({
      role: msg.userId === 'SAM' ? 'assistant' as const : 'user' as const,
      content: msg.message
    }));
}

async function broadcastToTrip(
  tripId: string,
  message: string,
  apiGateway: ApiGatewayManagementApiClient
) {
  // Get all connections for this trip
  const connectionsResult = await docClient.send(new QueryCommand({
    TableName: process.env.CONNECTIONS_TABLE!,
    IndexName: 'TripConnectionsIndex',
    KeyConditionExpression: 'tripId = :tripId',
    ExpressionAttributeValues: {
      ':tripId': tripId
    }
  }));

  const connections = connectionsResult.Items || [];

  // Send message to all connections
  await Promise.all(
    connections.map(async (connection) => {
      try {
        await apiGateway.send(new PostToConnectionCommand({
          ConnectionId: connection.connectionId,
          Data: Buffer.from(JSON.stringify({
            type: 'sam_response',
            message,
            timestamp: Date.now()
          }))
        }));
      } catch (error) {
        console.error(`Failed to send to ${connection.connectionId}:`, error);
      }
    })
  );
}
