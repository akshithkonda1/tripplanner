# Trippy — Native Swift App Plan

## Overview

Trippy is a native iOS app (Swift / SwiftUI) for budget-conscious travelers. It started as a road-trip planner, and it now covers **longer trips too** — multi-city, cross-country, and international — without losing the shoestring-budget DNA.

Two travel modes share the same itinerary, budget, group chat, and AI co-pilot:

| Mode | Who it's for | How you move |
|------|----------------|--------------|
| **Road Mode** | Classic road trips, weekend drives, looping routes | Drive the whole way; fuel, campsites, scenic stops |
| **Flight Mode** | Longer trips that aren't just road trips — city hops, international, slow travel | Fly between hubs, then walk / transit / train / rental car on the ground |

A trip can also be **hybrid**: fly into a region, road-trip locally, fly home (or onward). Mode is chosen at create-trip time and can be changed later; Sam and the map adapt to whichever legs you actually have.

The existing prototype uses React Native + AWS Lambda. This plan describes a ground-up rebuild as a native Swift app while keeping the same AWS backend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI (iOS 17+) |
| Architecture | MVVM + Swift Concurrency (async/await) |
| Navigation | NavigationStack / NavigationPath |
| Networking | URLSession + Codable models |
| Real-time | URLSessionWebSocketTask (group chat, AI responses) |
| Maps | MapKit (Apple Maps) |
| Local storage | SwiftData |
| Auth | Sign in with Apple + JWT |
| Push notifications | APNs via AWS SNS |
| Package manager | Swift Package Manager |

---

## Screens & Features

### 1. Onboarding / Auth
- Sign in with Apple (primary)
- Email/password fallback
- Profile setup: name, avatar, travel preferences

### 2. Home / Trip Dashboard
- List of upcoming, active, and past trips
- Each card shows a **Road / Flight / Hybrid** badge so mixed trips are obvious at a glance
- Filter by travel mode
- Quick-create trip FAB
- Search and filter trips
- Pull-to-refresh

### 3. Create Trip
- **Travel mode picker** (first decision, prominent segmented control):
  - **Road** — A-to-B (or loop) by car
  - **Flight** — longer / multi-city trip with flights
  - **Hybrid** — fly in, explore on the ground, fly out (or mix legs)
- Origin & destination picker (MapKit search/autocomplete)
  - Road: city / address search
  - Flight: **airport search** (IATA code + city), with "nearest cheap airport" suggestion
- **Multi-city builder** (Flight / Hybrid): add extra cities as ordered legs, not just origin → destination
- Date range selector, with **flexible dates** (±3 days) in Flight Mode to surface cheaper fares
- Trip type (solo, couple, family, friends)
- Budget input (optional — app is built for shoestring budgets)
- Invite participants by contact / link

### 4. Trip Detail / Itinerary
- Day-by-day itinerary timeline
  - Road: driving days and roadside stops
  - Flight: grouped by **city stay** (nights in a place), with flight legs as the seams between cities
- Drag-to-reorder stops (and reorder city stays in Flight Mode)
- Each stop shows: name, type icon, estimated time, cost, notes
- Tap a stop to see details, edit, or remove
- "Add Stop" / "Add City" button with search or AI suggestion
- Weather forecast per day (inline)

### 5. Interactive Map
- Full-screen MapKit view of the route
- **Mode-aware rendering**:
  - Road: driving polyline + fuel overlay
  - Flight: great-circle **flight arcs** between airports, then local pins in each city
  - Hybrid: arcs for air legs, polylines for drive legs
- Annotated pins for each stop (airport, lodging, activity, transit)
- Current-location tracking (opt-in)
- Fuel station overlay with prices (**Road / Hybrid drive legs only**)
- Tap pin → detail sheet

### 6. AI Trip Planner ("Sam")
- Chat-style interface to talk to the AI assistant
- Send natural-language requests
  - Road: "add a national park near Denver"
  - Flight: "give me 10 days in Japan under $1800 including flights"
- Sam is **mode-aware**: in Flight Mode it plans city days, transit, and cheap fares instead of scenic drives and gas stops
- AI responds with suggested itinerary changes
- One-tap accept/reject AI suggestions
- Streaming responses via WebSocket

### 7. Group Chat
- Real-time messaging for trip participants
- Typing indicators
- Message bubbles with timestamps
- Ability to @mention Sam (AI) inside group chat
- Add/remove participants modal

### 8. Budget Tracker
- Per-trip budget overview
- Categorized expenses: **flights**, fuel, food, lodging, activities, transit, misc
- Split expenses between participants
- Running total vs. budget bar chart
- Add expense form (amount, category, who paid, split method)
- **Multi-currency** in Flight Mode (home currency + local spend, converted at trip rates)

### 9. Booking Integration
- Search nearby lodging, campsites, hostels
- Price comparison (budget-first sorting)
- Deep-link or in-app booking flow
- Save confirmation to itinerary automatically
- Flight Mode also books **flights** (see Flight Mode below)

### 10. Fuel Planner (Road / Hybrid drive legs)
- Estimated fuel cost for the full route
- Cheapest gas stations along the route (GasBuddy / OPIS data)
- Alerts when approaching a cheap station
- Vehicle profile (MPG / tank size)
- Hidden when a trip has no drive legs

### 11. Weather Dashboard
- 10-day forecast for each stop / city
- Severe weather alerts along the route (or at destination cities in Flight Mode)
- "Best day to drive" suggestions (Road) / "avoid this storm for your outbound" (Flight)

### 12. Notifications & Settings
- Push notification preferences (trip updates, chat messages, weather alerts, deals)
- Flight Mode extras: check-in window, gate change, delay, cheap-fare drop on saved flexible dates
- App theme (light / dark / system)
- Units (miles/km, USD/other)
- Account management

### 13. Offline Mode
- Cache itinerary and map tiles for offline access
- Queue chat messages and expense entries to sync when back online
- SwiftData local persistence
- Flight Mode also caches **boarding passes / confirmation numbers** and city walking maps

### 14. Flight Mode

Flight Mode is how Trippy plans **longer trips that aren't road trips**: multi-city, international, and slow travel. Same app, same budget-first mindset — different skeleton.

**Create & structure**
- Start with cities, not a driving corridor. Add as many legs as you want (open-jaw and one-way are first-class, not special cases).
- Each **leg** has a transport type: `flight`, `train`, `bus`, `ferry`, `transit`, `walk`, or `drive` (hybrid).
- Duration can be weeks or months. The itinerary groups by **city stay** (e.g. "4 nights Lisbon") rather than "Day 3 of driving."
- Timezone-aware timeline so a red-eye doesn't land on the wrong calendar day.

**Flights (budget-first)**
- Search fares across dates and nearby airports; default sort is **cheapest total trip**, not shortest duration.
- Surface budget-airline / carry-on-only / error-fare style options with a clear "what you're giving up" callout (no free bag, tight connection).
- **Flexible dates** and "leave anytime this month" to catch cheaper windows.
- **Nearby cheaper airport** prompt (e.g. OAK vs SFO, STN vs LHR) with extra ground-transfer cost baked into the comparison.
- Save a chosen flight onto the itinerary; store confirmation, PNR, terminal, and bag policy.
- Check-in and gate-change reminders via push (opt-in). Live flight status for the active leg.

**On the ground after you land**
- City-day planner: neighborhoods, free/cheap activities, local transit, food.
- Ground transport suggestions ranked by cost: walk → transit → rideshare → rental car.
- Layover helper for long connections (leave the airport? lounge? sleep?).
- Lodging search prefers hostels, budget hotels, and longer-stay discounts.

**Longer-trip extras**
- Passport / visa / ETA checklist per destination (informational, with official-site links).
- Packing list that scales with trip length and climate, not a road-trip packing list.
- Currency converter pinned on the trip (home vs local).
- "Slow travel" pacing: Sam defaults to fewer hops and longer stays unless you ask for a whirlwind.

**What Flight Mode hides or swaps**
- Fuel overlay and "best day to drive" → flight cost + weather-at-hub.
- Scenic-drive suggestions → city days and intercity trains.
- Sam's persona: still a co-pilot, but it talks cities, fares, and stays instead of gas and mileage.

**Hybrid trips**
- Example: fly SFO → Denver, road-trip the Rockies for 8 days, fly home from Salt Lake City.
- The map, budget, and Sam treat each leg by its transport type. One trip, one group chat, one budget.

---

## Data Models (Swift)

```swift
enum TravelMode: String, Codable {
    case road, flight, hybrid
}

enum TransportType: String, Codable {
    case drive, flight, train, bus, ferry, transit, walk
}

struct Trip: Identifiable, Codable {
    let id: String
    var name: String
    var travelMode: TravelMode          // road | flight | hybrid
    var origin: Location                // first city / airport
    var destination: Location           // last city / airport (open-jaw OK)
    var legs: [TripLeg]                 // ordered; Road Mode has one drive leg
    var startDate: Date
    var endDate: Date
    var datesFlexible: Bool             // Flight Mode: ±3 days for cheaper fares
    var tripType: TripType
    var budget: Decimal?
    var homeCurrency: String            // e.g. "USD"
    var status: TripStatus
    var participants: [Participant]
    var itinerary: [DayPlan]
}

struct TripLeg: Identifiable, Codable {
    let id: String
    var transport: TransportType
    var from: Location
    var to: Location
    var departAt: Date?
    var arriveAt: Date?
    var estimatedCost: Decimal?
    var flight: FlightDetails?          // set when transport == .flight
}

struct FlightDetails: Codable {
    var airline: String
    var flightNumber: String
    var confirmationCode: String?
    var originAirport: Airport
    var destinationAirport: Airport
    var cabin: String                   // economy, basic, etc.
    var bagsIncluded: Int
    var layoverMinutes: Int?
    var bookingURL: String?
}

struct Airport: Codable {
    var iata: String                    // "LIS"
    var name: String
    var city: String
    var location: Location
}

struct Location: Codable {
    var lat: Double
    var lng: Double
    var name: String
    var timeZoneIdentifier: String?     // Flight Mode: itinerary is TZ-aware
}

struct DayPlan: Identifiable, Codable {
    let id: String
    var date: Date
    var city: String?                   // Flight Mode: "Lisbon" stay grouping
    var items: [ItineraryItem]
}

struct ItineraryItem: Identifiable, Codable {
    let id: String
    var type: StopType          // drive, flight, food, lodging, activity, fuel, rest, transit
    var name: String
    var location: Location
    var durationMinutes: Int
    var estimatedCost: Decimal?
    var currency: String?
    var notes: String?
    var isBooked: Bool
}

struct Expense: Identifiable, Codable {
    let id: String
    var tripId: String
    var amount: Decimal
    var currency: String
    var category: ExpenseCategory   // flights, fuel, food, lodging, activities, transit, misc
    var paidBy: String
    var splitAmong: [String]
    var note: String?
    var date: Date
}

struct ChatMessage: Identifiable, Codable {
    let id: String
    var tripId: String
    var userId: String
    var message: String
    var timestamp: Date
    var type: MessageType       // user, sam_response, system
}
```

---

## Navigation Structure

```
TabView
├── Home (Trip list — badges for Road / Flight / Hybrid)
│   └── Create Trip
│       └── Travel mode picker → Road | Flight | Hybrid
│   └── Trip Detail
│       ├── Itinerary tab   (days on the road, or city stays)
│       ├── Map tab         (drive polyline vs flight arcs)
│       ├── Flights tab     (Flight / Hybrid only)
│       ├── Budget tab
│       └── Chat tab
├── Explore (Nearby stops on the road; cheap destinations / deals in Flight Mode)
├── Sam (AI assistant — standalone chat, mode-aware)
└── Profile / Settings
```

---

## Backend Integration

The existing AWS Lambda backend (DynamoDB, WebSocket API Gateway, REST API Gateway) stays as the foundation. The Swift app replaces the React Native client. Flight Mode needs a few **additive** API fields and endpoints — existing road-trip clients keep working if `travelMode` defaults to `"road"`.

| Endpoint | Swift Integration |
|----------|------------------|
| `POST /trips` | `TripService.createTrip()` — body gains `travelMode`, `legs[]`, `datesFlexible` |
| `GET /trips/{id}` | `TripService.getTrip()` |
| `POST /trips/{id}/plan` | `TripService.generatePlan()` — Sam prompt branches on `travelMode` |
| `GET /flights/search` | `FlightService.search(origin:dest:dates:budget:)` — cheapest-first |
| `POST /trips/{id}/flights` | `FlightService.attachFlight(legId:)` — save a chosen fare onto a leg |
| `GET /flights/status/{flightNumber}` | `FlightService.status()` — live status for the active leg |
| WebSocket connect | `WebSocketManager.connect(tripId:userId:)` |
| WebSocket `sendMessage` | `WebSocketManager.send(message:)` |

Sam's system prompt must stop assuming every trip is a drive. Road Mode keeps the current "scenic route + gas" prompt; Flight Mode uses cities, fares, stays, and transit; Hybrid mixes both per leg.

---

## Milestone Roadmap

1. **Project scaffolding** — Xcode project, SPM deps, folder structure, base navigation
2. **Auth flow** — Sign in with Apple, token storage in Keychain
3. **Trip CRUD** — Create, list, view, edit trips against the REST API, including **travel mode**
4. **Itinerary & Map** — Day-by-day timeline + MapKit (drive polylines *and* flight arcs)
5. **AI Chat ("Sam")** — WebSocket integration, streaming responses, **mode-aware** prompts
6. **Group Chat** — Real-time messaging, typing indicators, participant management
7. **Budget Tracker** — Expense entry, split logic, charts, multi-currency
8. **Fuel & Weather** — Fuel overlay (Road), weather per stop / city
9. **Flight Mode** — Multi-city legs, fare search, attach flight to itinerary, check-in reminders
10. **Booking** — Lodging/campsite (all modes) + flight deep-links (Flight / Hybrid)
11. **Offline Mode** — SwiftData caching, offline queue, boarding-pass cache
12. **Polish** — Animations, haptics, accessibility, dark mode, App Store assets

---

## Design Principles

- **Budget-first**: costs surfaced everywhere, cheapest options highlighted (gas *or* fares)
- **Mode-honest**: Road, Flight, and Hybrid share one trip object, but the UI, map, and Sam only show what that mode needs
- **Flexibility**: easy to add, move, or drop stops — and cities — on the fly
- **Collaborative**: real-time group features so everyone stays in sync
- **Offline-ready**: dead zones on the highway *and* airplane mode — the itinerary still works
- **Conversational AI**: Sam is a co-pilot, not a menu — talk naturally, in whichever mode you're in
