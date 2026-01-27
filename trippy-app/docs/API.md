# Trippy API Documentation

## REST API Endpoints

Base URL: `https://your-api.execute-api.us-east-1.amazonaws.com`

### Trips

#### POST /trips
Create a new trip.

**Request Body:**
```json
{
  "tripName": "Summer Road Trip",
  "origin": {
    "lat": 40.7128,
    "lng": -74.0060,
    "name": "New York, NY"
  },
  "destination": {
    "lat": 34.0522,
    "lng": -118.2437,
    "name": "Los Angeles, CA"
  },
  "startDate": "2024-07-01",
  "endDate": "2024-07-10",
  "tripType": "family",
  "preferences": {
    "budget": 2000,
    "interests": ["food", "nature"],
    "pace": "moderate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "trip": {
    "tripId": "abc123",
    "tripName": "Summer Road Trip",
    "status": "planning",
    ...
  }
}
```

#### GET /trips
Get all trips for the current user.

**Response:**
```json
{
  "trips": [
    {
      "tripId": "abc123",
      "tripName": "Summer Road Trip",
      "startDate": "2024-07-01",
      ...
    }
  ]
}
```

#### GET /trips/{tripId}
Get trip details.

**Response:**
```json
{
  "trip": {
    "tripId": "abc123",
    "tripName": "Summer Road Trip",
    "origin": {...},
    "destination": {...},
    "participants": ["user1", "user2"],
    ...
  }
}
```

#### POST /trips/{tripId}/plan
Generate AI-powered trip itinerary.

**Request Body:**
```json
{
  "origin": {...},
  "destination": {...},
  "startDate": "2024-07-01",
  "endDate": "2024-07-10",
  "tripType": "family",
  "preferences": {...}
}
```

**Response:**
```json
{
  "success": true,
  "itinerary": {
    "overview": "10-day family road trip from NYC to LA",
    "totalDistance": 2800,
    "totalDuration": 45,
    "estimatedCost": 3500,
    "days": [
      {
        "day": 1,
        "date": "2024-07-01",
        "items": [
          {
            "type": "drive",
            "name": "NYC to Philadelphia",
            "location": {...},
            "startTime": "08:00",
            "duration": 120,
            "cost": 25,
            "description": "Morning drive to Philadelphia"
          }
        ]
      }
    ]
  },
  "weather": [...],
  "fuelData": {...}
}
```

#### POST /trips/{tripId}/participants
Add a participant to the trip.

**Request Body:**
```json
{
  "userId": "user-456"
}
```

---

## WebSocket API

WebSocket URL: `wss://your-ws-api.execute-api.us-east-1.amazonaws.com/production`

### Connection

Connect with query parameters:
```
?tripId={tripId}&userId={userId}
```

### Routes

#### sendMessage
Send a message to Sam (AI assistant).

**Payload:**
```json
{
  "action": "sendMessage",
  "tripId": "abc123",
  "userId": "user-456",
  "message": "Add a stop in Denver for lunch"
}
```

### Events

#### sam_response
Receive response from Sam.

```json
{
  "type": "sam_response",
  "message": "I've added a lunch stop in Denver! Here are some restaurant options...",
  "timestamp": 1234567890
}
```

#### itinerary_update
Receive itinerary updates.

```json
{
  "type": "itinerary_update",
  "itinerary": {...},
  "timestamp": 1234567890
}
```

#### group_message
Receive messages from other trip participants.

```json
{
  "type": "group_message",
  "userId": "user-789",
  "message": "I prefer the scenic route!",
  "timestamp": 1234567890
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limits

- REST API: 100 requests/minute
- WebSocket: 50 messages/minute

---

## Authentication

Currently using anonymous authentication. In production, integrate with Cognito or similar.

Headers:
```
Authorization: Bearer {token}
```
