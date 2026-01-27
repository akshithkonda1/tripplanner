#!/bin/bash

echo "Deploying Trippy Backend..."

# Build backend
cd backend
npm install
npm run build

# Deploy infrastructure
cd ../infrastructure
npm install
npm run build
npx cdk bootstrap
npx cdk deploy --all --require-approval never

echo "Backend deployed successfully!"
echo "Now build and deploy the mobile app separately"
