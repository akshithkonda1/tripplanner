import SwiftUI

struct TripDetailView: View {
    let trip: Trip

    var body: some View {
        TabView {
            itinerary
                .tabItem { Label("Itinerary", systemImage: "list.bullet.rectangle") }
            mapPlaceholder
                .tabItem { Label("Map", systemImage: "map") }
            if trip.travelMode != .road {
                flights
                    .tabItem { Label("Flights", systemImage: "airplane") }
            }
            budget
                .tabItem { Label("Budget", systemImage: "dollarsign.circle") }
            SamChatView(trip: trip)
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
        }
        .tint(TrippyTheme.color(for: trip.travelMode))
        .navigationTitle(trip.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var itinerary: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                if trip.itinerary.isEmpty {
                    Text(trip.travelMode == .road
                         ? "Ask Sam to sketch driving days and roadside stops."
                         : "Ask Sam to group this trip by city stays.")
                        .foregroundStyle(TrippyTheme.muted)
                } else {
                    ForEach(trip.itinerary) { day in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(day.city ?? day.date)
                                .font(.headline)
                            Text(day.date)
                                .font(.caption)
                                .foregroundStyle(TrippyTheme.muted)
                            ForEach(day.items) { item in
                                HStack {
                                    Image(systemName: icon(for: item.type))
                                    VStack(alignment: .leading) {
                                        Text(item.name)
                                        if let notes = item.notes {
                                            Text(notes).font(.caption).foregroundStyle(TrippyTheme.muted)
                                        }
                                    }
                                    Spacer()
                                    if let cost = item.estimatedCost {
                                        Text("$\(cost)")
                                            .font(.caption.weight(.semibold))
                                    }
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.7))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(TrippyTheme.cream.ignoresSafeArea())
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            ModeBadge(mode: trip.travelMode)
            Text(trip.routeLabel)
                .font(.title3.weight(.semibold))
            Text(trip.dateRangeLabel)
                .foregroundStyle(TrippyTheme.muted)
        }
    }

    private var mapPlaceholder: some View {
        VStack(spacing: 12) {
            Image(systemName: trip.travelMode == .road ? "point.topleft.down.to.point.bottomright.curvepath" : "airplane.departure")
                .font(.largeTitle)
                .foregroundStyle(TrippyTheme.color(for: trip.travelMode))
            Text(trip.travelMode == .road
                 ? "Driving polyline + fuel overlay lands here (MapKit)."
                 : "Flight arcs between airports land here (MapKit).")
                .multilineTextAlignment(.center)
                .foregroundStyle(TrippyTheme.muted)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TrippyTheme.cream.ignoresSafeArea())
    }

    private var flights: some View {
        List {
            ForEach(trip.legs.filter { $0.transport == .flight }) { leg in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(leg.from.name) → \(leg.to.name)")
                        .font(.headline)
                    if let cost = leg.estimatedCost {
                        Text("About $\(cost) · cheapest-first search next")
                            .font(.caption)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                }
            }
            if trip.datesFlexible {
                Text("Flexible dates are on — Sam will look ±3 days for cheaper fares.")
                    .font(.footnote)
                    .foregroundStyle(TrippyTheme.muted)
            }
        }
        .scrollContentBackground(.hidden)
        .background(TrippyTheme.cream.ignoresSafeArea())
    }

    private var budget: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let budget = trip.budget {
                Text("Trip budget")
                    .font(.subheadline)
                    .foregroundStyle(TrippyTheme.muted)
                Text("$\(budget) \(trip.homeCurrency)")
                    .font(.largeTitle.weight(.bold))
                Text(trip.travelMode == .flight
                     ? "Flights, lodging, transit, food — split with the group."
                     : "Fuel, food, lodging, activities — split with the group.")
                    .foregroundStyle(TrippyTheme.muted)
            } else {
                Text("No budget set. Add one anytime — Trippy is built for shoestring trips.")
                    .foregroundStyle(TrippyTheme.muted)
            }
            Spacer()
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TrippyTheme.cream.ignoresSafeArea())
    }

    private func icon(for type: StopType) -> String {
        switch type {
        case .drive: return "car"
        case .flight: return "airplane"
        case .food: return "fork.knife"
        case .lodging: return "bed.double"
        case .activity: return "star"
        case .fuel: return "fuelpump"
        case .rest: return "pause.circle"
        case .transit: return "tram"
        }
    }
}
