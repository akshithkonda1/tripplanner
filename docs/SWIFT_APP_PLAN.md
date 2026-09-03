# Trippy — Native Swift App Plan

## Overview

Trippy is a native iOS app (Swift / SwiftUI) for budget-conscious road trippers and long-term travelers. It keeps your mind on the open road by handling route planning, budgeting, group coordination, and real-time AI assistance — all from your phone.

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
- Quick-create trip FAB
- Search and filter trips
- Pull-to-refresh

### 3. Create Trip
- Origin & destination picker (MapKit search/autocomplete)
- Date range selector
- Trip type (solo, couple, family, friends)
- Budget input (optional — app is built for shoestring budgets)
- Invite participants by contact / link

### 4. Trip Detail / Itinerary
- Day-by-day itinerary timeline
- Drag-to-reorder stops
- Each stop shows: name, type icon, estimated time, cost, notes
- Tap a stop to see details, edit, or remove
- "Add Stop" button with search or AI suggestion
- Weather forecast per day (inline)

### 5. Interactive Map
- Full-screen MapKit view of the route
- Polyline route rendering
- Annotated pins for each stop
- Current-location tracking (opt-in)
- Fuel station overlay with prices
- Tap pin → detail sheet

### 6. AI Trip Planner ("Sam")
- Chat-style interface to talk to the AI assistant
- Send natural-language requests ("add a national park near Denver")
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
- Categorized expenses: fuel, food, lodging, activities, misc
- Split expenses between participants
- Running total vs. budget bar chart
- Add expense form (amount, category, who paid, split method)

### 9. Booking Integration
- Search nearby lodging, campsites, hostels
- Price comparison (budget-first sorting)
- Deep-link or in-app booking flow
- Save confirmation to itinerary automatically

### 10. Fuel Planner
- Estimated fuel cost for the full route
- Cheapest gas stations along the route (GasBuddy / OPIS data)
- Alerts when approaching a cheap station
- Vehicle profile (MPG / tank size)

### 11. Weather Dashboard
- 10-day forecast for each stop
- Severe weather alerts along the route
- "Best day to drive" suggestions

### 12. Notifications & Settings
- Push notification preferences (trip updates, chat messages, weather alerts, deals)
- App theme (light / dark / system)
- Units (miles/km, USD/other)
- Account management

### 13. Offline Mode
- Cache itinerary and map tiles for offline access
- Queue chat messages and expense entries to sync when back online
- SwiftData local persistence

---

## Data Models (Swift)

```swift
struct Trip: Identifiable, Codable {
    let id: String
    var name: String
    var origin: Location
    var destination: Location
    var startDate: Date
    var endDate: Date
    var tripType: TripType
    var budget: Decimal?
    var status: TripStatus
    var participants: [Participant]
    var itinerary: [DayPlan]
}

struct Location: Codable {
    var lat: Double
    var lng: Double
    var name: String
}

struct DayPlan: Identifiable, Codable {
    let id: String
    var date: Date
    var items: [ItineraryItem]
}

struct ItineraryItem: Identifiable, Codable {
    let id: String
    var type: StopType          // drive, food, lodging, activity, fuel, rest
    var name: String
    var location: Location
    var durationMinutes: Int
    var estimatedCost: Decimal?
    var notes: String?
    var isBooked: Bool
}

struct Expense: Identifiable, Codable {
    let id: String
    var tripId: String
    var amount: Decimal
    var category: ExpenseCategory
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
├── Home (Trip list)
│   └── Trip Detail
│       ├── Itinerary tab
│       ├── Map tab
│       ├── Budget tab
│       └── Chat tab
├── Explore (Nearby stops, deals)
├── Sam (AI assistant — standalone chat)
└── Profile / Settings
```

---

## Backend Integration

The existing AWS Lambda backend (DynamoDB, WebSocket API Gateway, REST API Gateway) stays as-is. The Swift app replaces the React Native client:

| Endpoint | Swift Integration |
|----------|------------------|
| `POST /trips` | `TripService.createTrip()` |
| `GET /trips/{id}` | `TripService.getTrip()` |
| `POST /trips/{id}/plan` | `TripService.generatePlan()` |
| WebSocket connect | `WebSocketManager.connect(tripId:userId:)` |
| WebSocket `sendMessage` | `WebSocketManager.send(message:)` |

---

## Milestone Roadmap

1. **Project scaffolding** — Xcode project, SPM deps, folder structure, base navigation
2. **Auth flow** — Sign in with Apple, token storage in Keychain
3. **Trip CRUD** — Create, list, view, edit trips against the REST API
4. **Itinerary & Map** — Day-by-day timeline + MapKit route rendering
5. **AI Chat ("Sam")** — WebSocket integration, streaming responses, suggestion accept/reject
6. **Group Chat** — Real-time messaging, typing indicators, participant management
7. **Budget Tracker** — Expense entry, split logic, charts
8. **Fuel & Weather** — Fuel price overlay, weather forecasts per stop
9. **Booking** — Lodging/campsite search and deep-link booking
10. **Offline Mode** — SwiftData caching, offline queue, background sync
11. **Polish** — Animations, haptics, accessibility, dark mode, App Store assets

---

## Design Principles

- **Budget-first**: costs surfaced everywhere, cheapest options highlighted
- **Flexibility**: easy to add, move, or drop stops on the fly
- **Collaborative**: real-time group features so everyone stays in sync
- **Offline-ready**: road trips go through dead zones — the app must work without signal
- **Conversational AI**: Sam is a co-pilot, not a menu — talk naturally
