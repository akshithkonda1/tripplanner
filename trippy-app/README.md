# AWS backend (and the React Native prototype)

This package is **cloud + AI** for Trippy: Lambda, DynamoDB, API Gateway, and Sam.

Sam's AI provider is pluggable via the `AI_PROVIDER` env var:
- `claude` (default) — Anthropic Claude on Amazon Bedrock (uses AWS IAM, no API key).
- `grok` — xAI Grok via the OpenAI-compatible xAI API (set `GROK_API_KEY`).

Native apps live at the repo root:

- [`ios/`](../ios) — Swift / SwiftUI
- [`android/`](../android) — Kotlin / Compose
- Product plan: [`../README.md`](../README.md)

`mobile/` is the older React Native client. New work goes in the native apps.

```
backend/          Lambda functions
infrastructure/  AWS CDK
mobile/          legacy React Native
docs/            HTTP + WebSocket API
```

```bash
cd backend && npm install && npm test
cd ../infrastructure && npm install && npx cdk deploy
```
