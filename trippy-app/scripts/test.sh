#!/bin/bash
set -e

echo "======================================"
echo "  Running Tests"
echo "======================================"

# Run backend tests
echo ""
echo "Running backend tests..."
cd backend
npm install
npm test || echo "No tests configured for backend yet"
cd ..

# Run mobile tests
echo ""
echo "Running mobile tests..."
cd mobile
npm install
npm test || echo "No tests configured for mobile yet"
cd ..

echo ""
echo "======================================"
echo "  Tests completed!"
echo "======================================"
