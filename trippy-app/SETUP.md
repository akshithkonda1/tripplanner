# Trippy - Road Trip Planning App

A complete road trip planning application with an AI assistant (Sam), real-time group chat, and smart itinerary generation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Mobile App Setup](#mobile-app-setup)
- [Infrastructure Deployment](#infrastructure-deployment)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Features

- 🤖 **AI Trip Planning** - Sam, powered by Claude, helps plan your perfect road trip
- 💬 **Real-time Group Chat** - Plan trips together with friends and family
- 🗺️ **Interactive Maps** - Visualize your route with Apple Maps
- ⛽ **Fuel & EV Charging** - Find gas stations and EV chargers along your route
- 🌤️ **Weather Forecasts** - Plan around weather conditions
- 🏨 **Booking Integration** - Direct links to book accommodations
- 🔔 **Push Notifications** - Stay updated on trip changes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Chat   │ │   Map    │ │ Booking  │ │ Settings │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS API Gateway                          │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   WebSocket API      │  │     REST API         │        │
│  └──────────┬───────────┘  └──────────┬───────────┘        │
└─────────────┼──────────────────────────┼────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Lambda                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ ChatHandler│ │TripPlanner │ │TripManage  │              │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
└────────┼──────────────┼──────────────┼──────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ DynamoDB │  │  Claude  │  │ElastiCache│  │ External │    │
│  │  Tables  │  │    AI    │  │  Redis   │  │   APIs   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Software

- **Node.js** 18.x or later
- **npm** 9.x or later
- **AWS CLI** v2 with configured credentials
- **AWS CDK** v2
- **Xcode** 15+ (for iOS development)
- **Android Studio** (for Android development)
- **CocoaPods** (for iOS dependencies)

### Required Accounts & API Keys

1. **AWS Account** - For backend infrastructure
2. **Anthropic API Key** - For Claude AI (Sam)
3. **OpenWeather API Key** - For weather forecasts
4. **GraphHopper API Key** (optional) - For route calculations

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/trippy.git
cd trippy

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Install all dependencies
npm run install:all

# Deploy backend (requires AWS credentials)
npm run deploy:backend

# Start mobile app
npm run start:mobile
```

## Backend Setup

### 1. Install Dependencies

```bash
cd trippy-app/backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```bash
# Required
CLAUDE_API_KEY=your_anthropic_api_key

# Optional (with fallbacks)
OPENWEATHER_API_KEY=your_openweather_key
GRAPHHOPPER_API_KEY=your_graphhopper_key
```

### 3. Build the Backend

```bash
npm run build
```

### 4. Run Tests

```bash
npm test
```

### 5. Local Development

For local testing with SAM CLI:

```bash
# Install SAM CLI first
brew install aws/tap/aws-sam-cli

# Start local API
sam local start-api
```

## Mobile App Setup

### 1. Install Dependencies

```bash
cd trippy-app/mobile
npm install
```

### 2. iOS Setup

```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Run on iOS simulator
npx react-native run-ios
```

### 3. Android Setup

```bash
# Ensure Android SDK is configured
# Set ANDROID_HOME environment variable

# Run on Android emulator
npx react-native run-android
```

### 4. Configure API Endpoints

Update `src/config/api.ts` with your deployed API endpoints:

```typescript
export const API_CONFIG = {
  HTTP_API_URL: 'https://your-api-id.execute-api.us-east-1.amazonaws.com',
  WS_API_URL: 'wss://your-ws-api-id.execute-api.us-east-1.amazonaws.com/production',
};
```

## Infrastructure Deployment

### 1. Install CDK Dependencies

```bash
cd trippy-app/infrastructure
npm install
```

### 2. Bootstrap CDK (first time only)

```bash
npx cdk bootstrap
```

### 3. Deploy All Stacks

```bash
# Deploy with environment variables
CLAUDE_API_KEY=your_key \
OPENWEATHER_API_KEY=your_key \
npx cdk deploy --all
```

### 4. Get Deployed Endpoints

After deployment, note the outputs:

```
TrippyBackendStack.WebSocketUrl = wss://xxxxx.execute-api.us-east-1.amazonaws.com/production
TrippyBackendStack.HttpApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | Yes | Anthropic API key for Claude |
| `OPENWEATHER_API_KEY` | No | OpenWeather API for forecasts |
| `GRAPHHOPPER_API_KEY` | No | GraphHopper for routing |
| `BOOKING_AFFILIATE_ID` | No | Booking.com affiliate ID |
| `EXPEDIA_AFFILIATE_ID` | No | Expedia affiliate ID |
| `VIATOR_PARTNER_ID` | No | Viator partner ID |

## Testing

### Backend Tests

```bash
cd trippy-app/backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Mobile Tests

```bash
cd trippy-app/mobile
npm test                 # Run all tests
npm run test:e2e         # End-to-end tests (requires Detox)
```

## Troubleshooting

### Common Issues

#### "CLAUDE_API_KEY is not defined"

Ensure your `.env` file is properly configured and loaded:

```bash
# Check if environment variable is set
echo $CLAUDE_API_KEY
```

#### iOS Build Fails

```bash
# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Clean build
npx react-native clean
```

#### Android Build Fails

```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
```

#### WebSocket Connection Fails

1. Check that the WebSocket API is deployed
2. Verify the URL in `src/config/api.ts`
3. Check CloudWatch logs for Lambda errors

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check `/docs` for API documentation
- **Logs**: Check CloudWatch for Lambda execution logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
