import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: TripStore
    @State private var showingCreate = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Keep your mind on the open road — or the next city.")
                        .font(.subheadline)
                        .foregroundStyle(TrippyTheme.muted)

                    modeFilter

                    if store.visibleTrips.isEmpty {
                        emptyState
                    } else {
                        ForEach(store.visibleTrips) { trip in
                            NavigationLink(value: trip.id) {
                                TripCard(trip: trip)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(20)
            }
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Trippy")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingCreate = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(TrippyTheme.rust)
                    }
                    .accessibilityLabel("Create trip")
                }
            }
            .navigationDestination(for: String.self) { id in
                if let trip = store.trip(id: id) {
                    TripDetailView(trip: trip)
                }
            }
            .sheet(isPresented: $showingCreate) {
                CreateTripView()
            }
        }
    }

    private var modeFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                filterChip(title: "All", selected: store.filter == nil) {
                    store.filter = nil
                }
                ForEach(TravelMode.allCases) { mode in
                    filterChip(title: mode.title, selected: store.filter == mode) {
                        store.filter = mode
                    }
                }
            }
        }
    }

    private func filterChip(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(selected ? TrippyTheme.ink : Color.white.opacity(0.7))
                .foregroundStyle(selected ? Color.white : TrippyTheme.ink)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text("No trips in this mode yet.")
                .font(.headline)
            Text("Create a Road, Flight, or Hybrid trip to get started.")
                .font(.subheadline)
                .foregroundStyle(TrippyTheme.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}
