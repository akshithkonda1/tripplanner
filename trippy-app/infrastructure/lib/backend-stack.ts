import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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

    // VPC for ElastiCache
    const vpc = new ec2.Vpc(this, 'TrippyVPC', {
      maxAzs: 2,
      natGateways: 1
    });

    // ElastiCache Redis
    const securityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Redis cluster',
      allowAllOutbound: true
    });

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      vpcSecurityGroupIds: [securityGroup.securityGroupId]
    });

    // Lambda Layer with dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/layers')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Anthropic SDK and other dependencies'
    });

    // Environment variables for all Lambdas
    const lambdaEnvironment = {
      TRIPS_TABLE: props.tables.trips.tableName,
      MESSAGES_TABLE: props.tables.messages.tableName,
      ITINERARY_TABLE: props.tables.itinerary.tableName,
      CONNECTIONS_TABLE: props.tables.connections.tableName,
      USERS_TABLE: props.tables.users.tableName,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
      REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress
    };

    // Chat Handler Lambda
    const chatHandler = new nodejs.NodejsFunction(this, 'ChatHandler', {
      entry: path.join(__dirname, '../../backend/src/lambdas/chatHandler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      layers: [dependenciesLayer],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    // Trip Planner Lambda
    const tripPlanner = new nodejs.NodejsFunction(this, 'TripPlanner', {
      entry: path.join(__dirname, '../../backend/src/lambdas/tripPlanner.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: lambdaEnvironment,
      layers: [dependenciesLayer]
    });

    // Trip Management Lambdas
    const createTrip = new nodejs.NodejsFunction(this, 'CreateTrip', {
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'createTrip',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment
    });

    const getTrip = new nodejs.NodejsFunction(this, 'GetTrip', {
      entry: path.join(__dirname, '../../backend/src/lambdas/tripManagement.ts'),
      handler: 'getTrip',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment
    });

    // Connection Handlers
    const connectHandler = new nodejs.NodejsFunction(this, 'ConnectHandler', {
      entry: path.join(__dirname, '../../backend/src/lambdas/connectionHandler.ts'),
      handler: 'connectHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment
    });

    const disconnectHandler = new nodejs.NodejsFunction(this, 'DisconnectHandler', {
      entry: path.join(__dirname, '../../backend/src/lambdas/connectionHandler.ts'),
      handler: 'disconnectHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment
    });

    // Grant DynamoDB permissions
    Object.values(props.tables).forEach(table => {
      table.grantReadWriteData(chatHandler);
      table.grantReadWriteData(tripPlanner);
      table.grantReadWriteData(createTrip);
      table.grantReadWriteData(getTrip);
      table.grantReadWriteData(connectHandler);
      table.grantReadWriteData(disconnectHandler);
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

    const webSocketStage = new apigateway.WebSocketStage(this, 'ProductionStage', {
      webSocketApi,
      stageName: 'production',
      autoDeploy: true
    });

    // Grant WebSocket API permissions to Lambda
    chatHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*`]
    }));

    // REST API
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
      path: '/trips/{tripId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetTripIntegration',
        getTrip
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
