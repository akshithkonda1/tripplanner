const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

async function seedData() {
  const testTrip = {
    PK: 'TRIP#test-123',
    SK: 'METADATA',
    tripId: 'test-123',
    tripName: 'Test Road Trip',
    origin: {
      lat: 40.7128,
      lng: -74.0060,
      name: 'New York, NY'
    },
    destination: {
      lat: 34.0522,
      lng: -118.2437,
      name: 'Los Angeles, CA'
    },
    startDate: '2024-08-01',
    endDate: '2024-08-10',
    tripType: 'solo',
    status: 'planning',
    createdBy: 'test-user',
    participants: ['test-user'],
    preferences: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const testMessages = [
    {
      PK: 'TRIP#test-123',
      SK: 'MSG#1706400000000',
      messageId: 'msg-001',
      tripId: 'test-123',
      senderId: 'test-user',
      senderName: 'Test User',
      content: 'Plan my route from New York to LA',
      timestamp: Date.now(),
      type: 'user'
    },
    {
      PK: 'TRIP#test-123',
      SK: 'MSG#1706400001000',
      messageId: 'msg-002',
      tripId: 'test-123',
      senderId: 'sam',
      senderName: 'Sam',
      content: "I'd love to help you plan this epic cross-country road trip! The route from New York to Los Angeles is approximately 2,800 miles and typically takes about 40 hours of driving. I recommend breaking it up into 4-5 days of driving.",
      timestamp: Date.now() + 1000,
      type: 'assistant'
    }
  ];

  try {
    // Seed trip
    await dynamodb.put({
      TableName: 'Trippy-Trips',
      Item: testTrip
    }).promise();
    console.log('Test trip seeded successfully!');

    // Seed messages
    for (const message of testMessages) {
      await dynamodb.put({
        TableName: 'Trippy-Messages',
        Item: message
      }).promise();
    }
    console.log('Test messages seeded successfully!');

    console.log('\nSeeded data:');
    console.log('- Trip ID: test-123');
    console.log('- Trip Name: Test Road Trip');
    console.log('- Route: New York, NY -> Los Angeles, CA');
    console.log('- Messages: 2 (user message + Sam response)');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData().catch(console.error);
