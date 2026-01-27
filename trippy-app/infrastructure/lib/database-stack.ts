import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class TrippyDatabaseStack extends cdk.Stack {
  public readonly tables: {
    trips: dynamodb.Table;
    messages: dynamodb.Table;
    itinerary: dynamodb.Table;
    connections: dynamodb.Table;
    users: dynamodb.Table;
  };

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Trips Table
    const tripsTable = new dynamodb.Table(this, 'TripsTable', {
      tableName: 'Trippy-Trips',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // GSI for querying user's trips
    tripsTable.addGlobalSecondaryIndex({
      indexName: 'UserTripsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER }
    });

    // Messages Table
    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'Trippy-Messages',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // Auto-delete old messages
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Itinerary Table
    const itineraryTable = new dynamodb.Table(this, 'ItineraryTable', {
      tableName: 'Trippy-Itinerary',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // WebSocket Connections Table
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'Trippy-Connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl'
    });

    // GSI for querying connections by trip
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'TripConnectionsIndex',
      partitionKey: { name: 'tripId', type: dynamodb.AttributeType.STRING }
    });

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Trippy-Users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    this.tables = {
      trips: tripsTable,
      messages: messagesTable,
      itinerary: itineraryTable,
      connections: connectionsTable,
      users: usersTable
    };

    // Outputs
    new cdk.CfnOutput(this, 'TripsTableName', {
      value: tripsTable.tableName,
      exportName: 'TrippyTripsTableName'
    });

    new cdk.CfnOutput(this, 'MessagesTableName', {
      value: messagesTable.tableName,
      exportName: 'TrippyMessagesTableName'
    });

    new cdk.CfnOutput(this, 'ItineraryTableName', {
      value: itineraryTable.tableName,
      exportName: 'TrippyItineraryTableName'
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
      exportName: 'TrippyConnectionsTableName'
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      exportName: 'TrippyUsersTableName'
    });
  }
}
