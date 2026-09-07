// Local end-to-end smoke test for the trip-management Lambda handlers.
//
// It exercises the real handlers (compiled to ./dist) against a local DynamoDB
// instance, covering the full trip lifecycle: create -> read -> add participant
// -> re-read -> 404 for a missing trip.
//
// Prerequisites:
//   1. Build the backend:  npm run build
//   2. Start DynamoDB Local on port 8000, e.g.
//        java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -inMemory -port 8000
//   3. Run:  npm run smoke:local
//
// Connection details default to a local DynamoDB and dummy credentials, so no
// AWS account is required.

process.env.AWS_ENDPOINT_URL ||= 'http://localhost:8000';
process.env.AWS_REGION ||= 'us-east-1';
process.env.AWS_ACCESS_KEY_ID ||= 'local';
process.env.AWS_SECRET_ACCESS_KEY ||= 'local';
process.env.TRIPS_TABLE ||= 'Trippy-Trips';

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';

const TABLE = process.env.TRIPS_TABLE;
const admin = new DynamoDBClient({});

async function ensureTable() {
  try {
    await admin.send(new DescribeTableCommand({ TableName: TABLE }));
    return;
  } catch {
    /* table does not exist yet */
  }
  await admin.send(
    new CreateTableCommand({
      TableName: TABLE,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'N' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserTripsIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    })
  );
  console.log(`[setup] created table ${TABLE}`);
}

function makeEvent({ body, pathParameters, sub = 'user-alice' }) {
  return {
    body: body ? JSON.stringify(body) : null,
    pathParameters: pathParameters || null,
    requestContext: { authorizer: { claims: { sub } } },
  };
}

async function main() {
  await ensureTable();
  // Import handlers AFTER env + table are ready so the SDK client resolves the
  // local endpoint at module-load time.
  const { createTrip, getTrip, addParticipant } = await import(
    '../dist/lambdas/tripManagement.js'
  );

  const step = (n, t) => console.log(`\n===== ${n}. ${t} =====`);

  step(1, 'createTrip (POST /trips)');
  const created = await createTrip(
    makeEvent({
      body: {
        tripName: 'Pacific Coast Highway Adventure',
        origin: { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
        destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        tripType: 'group',
        preferences: { budget: 'shoestring', avoidTolls: true },
      },
    }),
    {},
    () => {}
  );
  console.log('status:', created.statusCode);
  const trip = JSON.parse(created.body).trip;
  console.log('created tripId:', trip.tripId, '| name:', trip.tripName);

  step(2, 'getTrip (GET /trips/{tripId})');
  const fetched = await getTrip(
    makeEvent({ pathParameters: { tripId: trip.tripId } }),
    {},
    () => {}
  );
  console.log('status:', fetched.statusCode);
  console.log(
    'fetched trip:',
    JSON.stringify(JSON.parse(fetched.body).trip, null, 2)
  );

  step(3, 'addParticipant (POST /trips/{tripId}/participants)');
  const added = await addParticipant(
    makeEvent({
      pathParameters: { tripId: trip.tripId },
      body: { userId: 'user-bob' },
    }),
    {},
    () => {}
  );
  console.log('status:', added.statusCode, '| body:', added.body);

  step(4, 'getTrip again -> confirm participant persisted');
  const refetched = await getTrip(
    makeEvent({ pathParameters: { tripId: trip.tripId } }),
    {},
    () => {}
  );
  console.log('participants:', JSON.parse(refetched.body).trip.participants);

  step(5, 'getTrip for missing id -> expect 404');
  const missing = await getTrip(
    makeEvent({ pathParameters: { tripId: 'does-not-exist' } }),
    {},
    () => {}
  );
  console.log('status:', missing.statusCode, '| body:', missing.body);

  console.log('\n[done] end-to-end trip lifecycle exercised successfully.');
}

main().catch((e) => {
  console.error('E2E run failed:', e);
  process.exit(1);
});
