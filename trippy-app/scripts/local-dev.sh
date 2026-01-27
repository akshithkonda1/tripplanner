#!/bin/bash

echo "Starting local development environment..."

# Start backend locally (using SAM or serverless-offline)
cd backend
npm install
npm run dev &

# Start mobile app
cd ../mobile
npm install
npx react-native start

echo "Development environment ready!"
