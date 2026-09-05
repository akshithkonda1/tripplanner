import Foundation
import SwiftUI

@MainActor
final class TripStore: ObservableObject {
    @Published var trips: [Trip]
    @Published var filter: TravelMode?
    @Published var isSyncing = false

    init(trips: [Trip] = SampleTrips.all) {
        self.trips = trips
    }

    var visibleTrips: [Trip] {
        guard let filter else { return trips }
        return trips.filter { $0.travelMode == filter }
    }

    func add(_ trip: Trip) {
        trips.removeAll { $0.id == trip.id }
        trips.insert(trip, at: 0)
    }

    func trip(id: String) -> Trip? {
        trips.first { $0.id == id }
    }

    func refresh() async {
        guard APIConfiguration.isConfigured else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            let remote = try await APIClient.shared.listTrips()
            let sampleIds = Set(remote.map(\.id))
            trips = remote + SampleTrips.all.filter { !sampleIds.contains($0.id) }
        } catch {
            // Stay on sample + locally created trips if AWS is unreachable.
        }
    }

    func create(_ trip: Trip) async {
        if APIConfiguration.isConfigured {
            do {
                let request = CreateTripRequest(
                    tripName: trip.name,
                    travelMode: trip.travelMode,
                    origin: trip.origin,
                    destination: trip.destination,
                    legs: trip.legs,
                    startDate: trip.startDate,
                    endDate: trip.endDate,
                    datesFlexible: trip.datesFlexible,
                    tripType: trip.tripType,
                    preferences: .init(budget: trip.budget.map { NSDecimalNumber(decimal: $0).doubleValue }),
                    homeCurrency: trip.homeCurrency
                )
                let remote = try await APIClient.shared.createTrip(request)
                add(remote)
                return
            } catch {
                // Fall through and keep the local trip so planning still works offline.
            }
        }
        add(trip)
    }
}
