#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Trippy monorepo.
# Installs JS dependencies for all packages, builds the backend and
# infrastructure, and fetches DynamoDB Local (used for local backend testing).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$REPO_ROOT/trippy-app"

echo "==> Installing backend + mobile workspace dependencies"
cd "$APP_DIR"
npm install

echo "==> Installing infrastructure dependencies"
cd "$APP_DIR/infrastructure"
npm install

echo "==> Building backend (tsc)"
cd "$APP_DIR/backend"
npm run build

echo "==> Building infrastructure (tsc)"
cd "$APP_DIR/infrastructure"
npm run build

# DynamoDB Local gives the serverless backend a real database to run against
# locally without any AWS account. Downloaded once; persisted into the snapshot.
DDB_DIR="$HOME/dynamodb-local"
if [ ! -f "$DDB_DIR/DynamoDBLocal.jar" ]; then
  echo "==> Fetching DynamoDB Local"
  mkdir -p "$DDB_DIR"
  curl -fsSL -o "$DDB_DIR/dynamodb_local_latest.tar.gz" \
    https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz
  tar xzf "$DDB_DIR/dynamodb_local_latest.tar.gz" -C "$DDB_DIR"
else
  echo "==> DynamoDB Local already present, skipping download"
fi

echo "==> Install complete"
