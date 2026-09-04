import Foundation
import SwiftUI

@MainActor
final class TripStore: ObservableObject {
    @Published var trips: [Trip]
    @Published var filter: TravelMode?

    init(trips: [Trip] = SampleTrips.all) {
        self.trips = trips
    }

    var visibleTrips: [Trip] {
        guard let filter else { return trips }
        return trips.filter { $0.travelMode == filter }
    }

    func add(_ trip: Trip) {
        trips.insert(trip, at: 0)
    }

    func trip(id: String) -> Trip? {
        trips.first { $0.id == id }
    }
}
