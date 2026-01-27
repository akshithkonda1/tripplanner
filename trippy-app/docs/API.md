# Trippy API Documentation

## REST API Endpoints

### POST /trips
Create a new trip

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
    "tripId": "uuid-here",
    "tripName": "Summer Road Trip",
    "status": "planning",
    "createdAt": 1234567890
  }
}
```

### GET /trips/{tripId}
Get trip details

**Response:**
```json
{
  "trip": {
    "tripId": "uuid-here",
    "tripName": "Summer Road Trip",
    "origin": {...},
    "destination": {...},
    "startDate": "2024-07-01",
    "endDate": "2024-07-10",
    "status": "planning",
    "participants": ["user-1", "user-2"]
  }
}
```

### POST /trips/{tripId}/plan
Generate trip itinerary with AI

**Request Body:**
```json
{
  "message": "Plan a scenic route with stops at national parks"
}
```

**Response:**
```json
{
  "itinerary": {
    "tripId": "uuid-here",
    "days": [
      {
        "date": "2024-07-01",
        "items": [
          {
            "type": "drive",
            "name": "Depart from New York",
            "location": {"lat": 40.7128, "lng": -74.0060},
            "duration": 180,
            "notes": "Start early to beat traffic"
          }
        ]
      }
    ]
  }
}
```

## WebSocket API

### Connect
```
wss://your-ws-api.execute-api.us-east-1.amazonaws.com/production?tripId={tripId}&userId={userId}
```

### Send Message
```json
{
  "action": "sendMessage",
  "tripId": "trip-123",
  "userId": "user-456",
  "message": "Add a stop in Denver"
}
```

### Receive Messages

**Sam Response:**
```json
{
  "type": "sam_response",
  "message": "I've added Denver to your route!",
  "timestamp": 1234567890
}
```

**Itinerary Update:**
```json
{
  "type": "itinerary_update",
  "tripId": "trip-123",
  "itinerary": {...}
}
```

**Group Message:**
```json
{
  "type": "group_message",
  "tripId": "trip-123",
  "userId": "user-789",
  "message": "What about stopping in Vegas?",
  "timestamp": 1234567890
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid or missing auth token)
- `404` - Not Found (trip doesn't exist)
- `500` - Internal Server Error

## Authentication

All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Rate Limits

- REST API: 100 requests per minute per user
- WebSocket: 50 messages per minute per connection
