# Trippy - AI-Powered Road Trip Planner

Sam-powered road trip planning with real-time collaboration.

## Architecture

- **Backend**: AWS Lambda (Serverless)
- **Mobile**: React Native
- **AI**: Claude (Sonnet 4 + Opus 4)
- **Maps**: Apple Maps (native on iOS)
- **Database**: DynamoDB
- **Real-time**: WebSocket API

## Project Structure

```
trippy-app/
├── backend/           # Lambda functions and services
│   └── src/
│       ├── lambdas/   # Lambda handlers
│       └── services/  # Weather, fuel, booking, maps
├── mobile/            # React Native app
│   └── src/
│       ├── screens/   # App screens
│       ├── services/  # API and WebSocket clients
│       └── config/    # Configuration
├── infrastructure/    # AWS CDK stacks
│   └── lib/           # CDK stack definitions
├── scripts/           # Deployment and dev scripts
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- AWS CLI configured
- Xcode (for iOS) or Android Studio (for Android)
- Claude API key

### 1. Setup Environment

```bash
cd trippy-app
cp .env.example .env
# Edit .env with your API keys
```

### 2. Deploy Backend

```bash
./scripts/deploy.sh
```

### 3. Run Mobile App

```bash
cd mobile
npm install
npx react-native run-ios  # or run-android
```

## Features

### Sam - AI Trip Planner
- Natural language trip planning
- Route optimization with stops
- Weather-aware scheduling
- Budget tracking

### Real-time Collaboration
- Group chat via WebSocket
- Shared itinerary editing
- Live updates

### Smart Routing
- Weather forecasts along route
- Gas and EV charging stations
- Accommodation booking links
- Restaurant recommendations

## API Documentation

See [docs/API.md](docs/API.md) for full API documentation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_API_KEY` | Anthropic API key |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key |
| `GRAPHHOPPER_API_KEY` | GraphHopper routing (optional) |
| `AWS_REGION` | AWS deployment region |

## Tech Stack

- **Backend**: TypeScript, AWS Lambda, API Gateway, DynamoDB
- **Mobile**: React Native, TypeScript
- **AI**: Claude Sonnet 4 (chat), Claude Opus 4 (planning)
- **Maps**: Apple Maps (iOS native), OpenStreetMap
- **Infrastructure**: AWS CDK

## License

Private - All rights reserved.
