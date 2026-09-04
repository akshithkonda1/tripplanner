# Trippy for iOS

This is the product. Kotlin waits until this app is right.

```bash
brew install xcodegen
cd ios && xcodegen generate
open Trippy.xcodeproj
```

iOS 17+ / Xcode 16.

## What is on the phone

- Cognito sign-in (or guest)
- Road / Flight / Hybrid trips
- Itinerary you can edit
- MapKit (no Google, no fare overlays)
- Flights and stays **you type** — no Skyscanner / Amadeus / Hotels.com
- Budget ledger
- Fuel estimate = MapKit/haversine miles × your MPG × a price you type
- Packing + passport checklist (you check the official government site)
- Sam on device; Bedrock when AWS is wired

## AWS (after `cdk deploy`)

Set these in the Xcode scheme:

- `COGNITO_REGION`
- `COGNITO_CLIENT_ID` (output `TrippyUserPoolClientId`)
- `HTTP_API_URL`
- `WS_API_URL`

Until those are real values, guest mode runs the full app on SwiftData.
