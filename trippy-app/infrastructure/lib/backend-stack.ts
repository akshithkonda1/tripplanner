import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface BackendStackProps extends cdk.StackProps {
  tables: {
    trips: dynamodb.Table;
    messages: dynamodb.Table;
    itinerary: dynamodb.Table;
    connections: dynamodb.Table;
    users: dynamodb.Table;
  };
}

export class TrippyBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // Environment variables for all Lambdas
    const lambdaEnvironment = {
      TRIPS_TABLE: props.tables.trips.tableName,
      MESSAGES_TABLE: props.tables.messages.tableName,
      ITINERARY_TABLE: props.tables.itinerary.tableName,
      CONNECTIONS_TABLE: props.tables.connections.tableName,
      USERS_TABLE: props.tables.users.tableName,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
      GRAPHHOPPER_API_KEY: process.env.GRAPHHOPPER_API_KEY || ''
    };

    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*']
      }
    };

    // Chat Handler Lambda
    const chatHandler = new nodejs.NodejsFunction(this, 'ChatHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/chatHandler.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Trip Planner Lambda
    const tripPlanner = new nodejs.NodejsFunction(this, 'TripPlanner', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/tripPlanner.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024
    });

    // Trip Management Lambdas
    const createTrip = new nodejs.NodejsFunction(this, 'CreateTrip', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'createTrip'
    });

    const getTrip = new nodejs.NodejsFunction(this, 'GetTrip', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'getTrip'
    });

    const getUserTrips = new nodejs.NodejsFunction(this, 'GetUserTrips', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'getUserTrips'
    });

    const addParticipant = new nodejs.NodejsFunction(this, 'AddParticipant', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'addParticipant'
    });

    // Connection Handlers
    const connectHandler = new nodejs.NodejsFunction(this, 'ConnectHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/connectionHandler.ts'),
      handler: 'connectHandler'
    });

    const disconnectHandler = new nodejs.NodejsFunction(this, 'DisconnectHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../../backend/src/lambdas/connectionHandler.ts'),
      handler: 'disconnectHandler'
    });

    // Grant DynamoDB permissions to all Lambdas
    const allLambdas = [
      chatHandler,
      tripPlanner,
      createTrip,
      getTrip,
      getUserTrips,
      addParticipant,
      connectHandler,
      disconnectHandler
    ];

    Object.values(props.tables).forEach(table => {
      allLambdas.forEach(fn => table.grantReadWriteData(fn));
    });

    // WebSocket API
    const webSocketApi = new apigateway.WebSocketApi(this, 'TrippyWebSocketApi', {
      apiName: 'TrippyWebSocketApi',
      connectRouteOptions: {
        integration: new apigatewayIntegrations.WebSocketLambdaIntegration(
          'ConnectIntegration',
          connectHandler
        )
      },
      disconnectRouteOptions: {
        integration: new apigatewayIntegrations.WebSocketLambdaIntegration(
          'DisconnectIntegration',
          disconnectHandler
        )
      },
      defaultRouteOptions: {
        integration: new apigatewayIntegrations.WebSocketLambdaIntegration(
          'DefaultIntegration',
          chatHandler
        )
      }
    });

    // Add sendMessage route
    webSocketApi.addRoute('sendMessage', {
      integration: new apigatewayIntegrations.WebSocketLambdaIntegration(
        'SendMessageIntegration',
        chatHandler
      )
    });

    const webSocketStage = new apigateway.WebSocketStage(this, 'ProductionStage', {
      webSocketApi,
      stageName: 'production',
      autoDeploy: true
    });

    // Grant WebSocket API permissions to chat Lambda
    chatHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*`]
    }));

    // REST API (HTTP API v2)
    const httpApi = new apigateway.HttpApi(this, 'TrippyHttpApi', {
      apiName: 'TrippyHttpApi',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*']
      }
    });

    // REST API Routes
    httpApi.addRoutes({
      path: '/trips',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'CreateTripIntegration',
        createTrip
      )
    });

    httpApi.addRoutes({
      path: '/trips',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetUserTripsIntegration',
        getUserTrips
      )
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetTripIntegration',
        getTrip
      )
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}/participants',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AddParticipantIntegration',
        addParticipant
      )
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}/plan',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'PlanTripIntegration',
        tripPlanner
      )
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: webSocketStage.url,
      exportName: 'TrippyWebSocketUrl'
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.apiEndpoint,
      exportName: 'TrippyHttpApiUrl'
    });
  }
}
