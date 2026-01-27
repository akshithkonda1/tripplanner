#!/bin/bash
set -e

echo "======================================"
echo "  Deploying Trippy Backend"
echo "======================================"

# Check for required environment variables
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "Error: CLAUDE_API_KEY environment variable is not set"
    exit 1
fi

# Build backend
echo ""
echo "Building backend..."
cd backend
npm install
npm run build
cd ..

# Deploy infrastructure
echo ""
echo "Deploying infrastructure..."
cd infrastructure
npm install
npm run build

# Bootstrap CDK (if not already done)
echo "Bootstrapping CDK..."
npx cdk bootstrap --require-approval never || true

# Deploy all stacks
echo "Deploying CDK stacks..."
npx cdk deploy --all --require-approval never

cd ..

echo ""
echo "======================================"
echo "  Backend deployed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Copy the API endpoints from the CDK output above"
echo "2. Update mobile/src/config/api.ts with the endpoints"
echo "3. Build and deploy the mobile app separately"
echo ""
