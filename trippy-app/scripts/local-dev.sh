#!/bin/bash

echo "======================================"
echo "  Starting Local Development"
echo "======================================"

# Check for required files
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Copy .env.example to .env and fill in values."
    echo "cp .env.example .env"
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo ""
echo "Starting mobile app development server..."
echo ""

# Start mobile app
cd mobile
npm install

echo ""
echo "======================================"
echo "  Development environment ready!"
echo "======================================"
echo ""
echo "To start the app:"
echo "  - iOS: npx react-native run-ios"
echo "  - Android: npx react-native run-android"
echo ""
echo "Note: Make sure you have Xcode/Android Studio configured"
echo ""

# Start Metro bundler
npx react-native start
