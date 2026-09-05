# Trippy

Trippy is a budget-first trip planner for people who want to keep their mind on the open road — or on a longer trip that isn’t a road trip at all. It started as a shoestring road-trip app. It now covers **Road**, **Flight**, and **Hybrid** travel without losing that flexibility.

Sam (the AI co-pilot), group chat, itinerary, budget, and maps are shared across modes. The mode you pick changes how you move, not whether you get help.

| Mode | Who it's for | How you move |
|------|----------------|--------------|
| **Road** | Classic road trips, weekend drives, looping routes | Drive the whole way — fuel, campsites, scenic stops |
| **Flight** | Longer trips — city hops, international, slow travel | Fly between hubs, then walk / transit / train / rental car on the ground |
| **Hybrid** | Fly in, explore on the ground, fly out | Mix air legs and drive legs in one trip, one budget, one group chat |

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Apple** | Swift · SwiftUI (iOS 17+) · MapKit · SwiftData |
| **Android** | Kotlin · Jetpack Compose · Google Maps · Room |
| **Cloud** | AWS Lambda · API Gateway · DynamoDB · Cognito · Bedrock |
| **AI** | Amazon Bedrock (Claude) — Sam plans on AWS compute, not a travel-vendor API |
| **Auth** | **Amazon Cognito** (email/password; Sign in with Apple can federate later) |
| **Maps / device** | MapKit · SwiftData — no Skyscanner, Amadeus, GasBuddy, or weather APIs |

**iOS first.** We build and perfect the Swift app, then port the same product to Kotlin. Android under `android/` stays a scaffold until iOS is the source of truth.

**No third-party travel APIs.** Flight Mode, fuel, lodging notes, and Explore are on-device (what you type, MapKit, a bundled airport list) plus AWS for identity, storage, and Sam. You log a flight or a hostel yourself; we do not scrape or buy fares.

---

## Repository

```
ios/                 Swift / SwiftUI app
android/             Kotlin / Compose app  ( :app UI, :domain models + AWS API client )
shared/api           JSON fixtures both clients and Lambdas agree on
trippy-app/backend   AWS Lambda (trips, Sam on Bedrock, chat)
trippy-app/infrastructure   AWS CDK
trippy-app/docs      API notes
```

---

## Features

### 1. Onboarding / Auth
Amazon Cognito — email + password, confirm code, sign out. Guest mode still opens the full app on SwiftData until you sign in.

### 2. Home / Trip Dashboard
Upcoming, active, and past trips. Each card shows a **Road / Flight / Hybrid** badge. Filter by mode. Pull-to-refresh. Quick-create.

### 3. Create Trip
Travel mode is the first decision.

- **Road** — city / address search
- **Flight** — airport search (IATA + city), nearest cheap airport, multi-city legs, flexible dates (±3 days)
- **Hybrid** — mix legs (fly, drive, train, bus, ferry)

Then: dates, who you're traveling with (solo / couple / family / friends), optional budget, invite link.

### 4. Itinerary
Day-by-day timeline. Road trips are driving days; Flight Mode groups by **city stay** (“4 nights Lisbon”). Drag to reorder. Add a stop or a city. Weather inline.

### 5. Map
Mode-aware: driving polylines + fuel overlay on the road; great-circle **flight arcs** between airports; both on hybrid trips.

### 6. Sam (AI)
Talk naturally. Road: “add a national park near Denver.” Flight: “10 days in Japan under $1800.” Sam is mode-aware. On device he sketches itineraries with no vendor APIs; when AWS is configured he uses Bedrock on Lambda.

### 7. Group Chat
Realtime messages, typing indicators, @Sam in the thread, add/remove people.

### 8. Budget
Flights, fuel, food, lodging, activities, transit. Split with the group. Multi-currency on Flight Mode.

### 9. Stays you log
No hotel/flight booking APIs. Save a hostel name, confirmation, and cost onto the itinerary yourself.

### 10. Fuel (Road / Hybrid drive legs)
Local estimate: MapKit distance × your MPG × a price you type. No station-price API.

### 11. Notes, not weather APIs
Trip notes and packing/visa checklists. Forecasts are not pulled from a weather vendor.

### 12. Notifications & Settings
Trip updates, chat, weather, deals. Flight extras: check-in window, gate change, delay, fare drop on flexible dates.

### 13. Offline
Cached itinerary and maps. Queued chat and expenses. Flight Mode also caches confirmation numbers / boarding-pass details.

### 14. Flight Mode (longer trips)

Flight Mode is how Trippy plans trips that aren’t road trips: multi-city, international, slow travel.

- Cities and **legs**, not a driving corridor. Open-jaw and one-way are normal.
- Cheapest-total fare search, flexible dates, nearby cheaper airports, honest budget-airline tradeoffs.
- After you land: city days, cheap lodging, transit ranked by cost, layover helper.
- Timezone-aware timeline, visa/ETA checklist, packing list, currency converter.
- Sam defaults to fewer hops and longer stays unless you ask for a whirlwind.

Hybrid example: fly SFO → Denver, road-trip the Rockies for 8 days, fly home from Salt Lake City.

---

## Navigation

```
Tabs
├── Home          trip list (Road / Flight / Hybrid badges)
│   ├── Create    mode picker → Road | Flight | Hybrid
│   └── Trip
│       ├── Itinerary
│       ├── Map
│       ├── Flights   (Flight / Hybrid)
│       ├── Budget
│       └── Chat
├── Explore       roadside stops, or cheap destinations in Flight Mode
├── Sam           standalone AI chat
└── Profile
```

---

## Shared models

Both apps encode the same JSON the AWS API stores.

```
TravelMode      road | flight | hybrid
TransportType   drive | flight | train | bus | ferry | transit | walk
Trip            id, name, travelMode, origin, destination, legs[],
                dates, datesFlexible, tripType, budget, homeCurrency,
                status, participants, itinerary
TripLeg         transport, from, to, times, cost, optional FlightDetails
FlightDetails   airline, number, PNR, airports, cabin, bags, layover
```

See `ios/Trippy/Models` and `android/domain` — they stay in lockstep.

---

## AWS API

Foundation: Lambda + DynamoDB + HTTP API + WebSocket API. `travelMode` defaults to `"road"` so older clients keep working.

| Endpoint | Purpose |
|----------|---------|
| `POST /trips` | Create trip (`travelMode`, `legs[]`, `datesFlexible`) |
| `GET /trips` | List the signed-in user's trips (`getUserTrips`) |
| `GET /trips/{id}` | Trip detail |
| `POST /trips/{id}/plan` | Sam generates an itinerary (prompt branches on mode) |
| `GET /flights/search` | Cheapest-first fare search |
| `POST /trips/{id}/flights` | Attach a fare to a leg |
| `GET /flights/status/{flightNumber}` | Live status |
| WebSocket | Group chat + Sam streaming |

Sam on Bedrock: Road Mode keeps scenic-route + gas planning. Flight Mode uses cities, fares, stays, and transit. Hybrid mixes both per leg.

---

## Getting started

### iOS (Xcode on a Mac)

```bash
brew install xcodegen          # once
cd ios && xcodegen generate
open Trippy.xcodeproj
```

Requires iOS 17+ / Xcode 16. After `cdk deploy`, set `COGNITO_REGION`, `COGNITO_CLIENT_ID`, and `HTTP_API_URL` in the scheme. Leave them as placeholders to use guest mode + SwiftData.

### Android

```bash
cd android
./gradlew :domain:test         # models, no Android SDK required
./gradlew :app:assembleDebug   # needs Android SDK 35
```

Open `android/` in Android Studio (Koala+). `minSdk` 26.

### AWS (cloud + AI)

```bash
cd trippy-app/backend && npm install && npm test
cd ../infrastructure && npm install && npx cdk deploy
```

Needs AWS credentials and Bedrock model access in the target region. See `trippy-app/SETUP.md`.

---

## Roadmap

1. **iOS majority (now)** — Cognito, SwiftData, MapKit, itinerary, Flight Mode without vendor APIs, budget, fuel math, packing, on-device Sam
2. **Cognito + AWS deploy** — plug real pool IDs into the Xcode scheme, sync trips when signed in
3. **Sam on Bedrock** — signed-in planning through Lambda
4. **Group chat** — WebSocket, still AWS, still no travel vendors
5. **iOS polish** — geocode typed cities with MapKit, haptics, a11y, dark mode
6. **Kotlin port** — after iOS is the source of truth
7. **Store listing**

---

## Design principles

- **Budget-first** — costs everywhere; cheapest gas *or* fare wins the default sort
- **Mode-honest** — one trip object; the UI, map, and Sam only show what that mode needs
- **Flexible** — add, move, or drop stops and cities on the fly
- **Collaborative** — the group stays in sync
- **Offline-ready** — highway dead zones and airplane mode
- **Conversational** — Sam is a co-pilot, not a menu
