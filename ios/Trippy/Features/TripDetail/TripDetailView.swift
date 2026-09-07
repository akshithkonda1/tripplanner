import SwiftUI

struct TripDetailView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore

    var body: some View {
        if let workspace = store.workspace(id: tripId) {
            content(workspace)
        } else {
            Text("Trip not found").foregroundStyle(TrippyTheme.muted)
        }
    }

    @ViewBuilder
    private func content(_ workspace: TripWorkspace) -> some View {
        TabView {
            ItineraryEditorView(tripId: tripId)
                .tabItem { Label("Itinerary", systemImage: "list.bullet.rectangle") }
            TripMapView(workspace: workspace)
                .tabItem { Label("Map", systemImage: "map") }
            if workspace.trip.travelMode != .road {
                FlightsView(tripId: tripId)
                    .tabItem { Label("Flights", systemImage: "airplane") }
            }
            BudgetView(tripId: tripId)
                .tabItem { Label("Budget", systemImage: "dollarsign.circle") }
            if workspace.trip.travelMode != .flight {
                FuelView(tripId: tripId)
                    .tabItem { Label("Fuel", systemImage: "fuelpump") }
            }
            PackingView(tripId: tripId)
                .tabItem { Label("Pack", systemImage: "bag") }
            SamChatView(tripId: tripId)
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
        }
        .tint(TrippyTheme.color(for: workspace.trip.travelMode))
        .navigationTitle(workspace.trip.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
