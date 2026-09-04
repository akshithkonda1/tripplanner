import Foundation

enum SampleTrips {
    static let all: [Trip] = [pacificCoast, japanHop, rockiesHybrid]

    static let pacificCoast = Trip(
        id: "sample-road",
        name: "Pacific Coast Highway",
        travelMode: .road,
        origin: Location(lat: 37.7749, lng: -122.4194, name: "San Francisco, CA"),
        destination: Location(lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA"),
        legs: [
            TripLeg(
                id: "pch-drive",
                transport: .drive,
                from: Location(lat: 37.7749, lng: -122.4194, name: "San Francisco, CA"),
                to: Location(lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA"),
                estimatedCost: 180
            )
        ],
        startDate: "2026-10-03",
        endDate: "2026-10-09",
        tripType: .friends,
        budget: 900,
        status: .upcoming,
        participants: [Participant(id: "you", name: "You")],
        itinerary: [
            DayPlan(
                id: "pch-d1",
                date: "2026-10-03",
                city: "Santa Cruz",
                items: [
                    ItineraryItem(
                        id: "pch-1",
                        type: .drive,
                        name: "SF → Santa Cruz via Hwy 1",
                        location: Location(lat: 36.9741, lng: -122.0308, name: "Santa Cruz, CA"),
                        durationMinutes: 150,
                        estimatedCost: 28,
                        notes: "Leave after the morning fog lifts",
                        isBooked: false
                    )
                ]
            )
        ]
    )

    static let japanHop = Trip(
        id: "sample-flight",
        name: "Two weeks in Japan",
        travelMode: .flight,
        origin: Location(lat: 37.6213, lng: -122.3790, name: "SFO"),
        destination: Location(lat: 35.5494, lng: 139.7798, name: "HND"),
        legs: [
            TripLeg(
                id: "jp-out",
                transport: .flight,
                from: Location(lat: 37.6213, lng: -122.3790, name: "San Francisco"),
                to: Location(lat: 35.5494, lng: 139.7798, name: "Tokyo"),
                estimatedCost: 640
            ),
            TripLeg(
                id: "jp-rail",
                transport: .train,
                from: Location(lat: 35.6812, lng: 139.7671, name: "Tokyo"),
                to: Location(lat: 34.9859, lng: 135.7588, name: "Kyoto"),
                estimatedCost: 85
            )
        ],
        startDate: "2026-11-02",
        endDate: "2026-11-16",
        datesFlexible: true,
        tripType: .couple,
        budget: 2800,
        status: .planning,
        participants: [
            Participant(id: "you", name: "You"),
            Participant(id: "plus-one", name: "Alex")
        ],
        itinerary: [
            DayPlan(
                id: "jp-d1",
                date: "2026-11-02",
                city: "Tokyo",
                items: [
                    ItineraryItem(
                        id: "jp-1",
                        type: .flight,
                        name: "SFO → HND",
                        location: Location(lat: 35.5494, lng: 139.7798, name: "Haneda"),
                        durationMinutes: 650,
                        estimatedCost: 640,
                        currency: "USD",
                        isBooked: false
                    )
                ]
            )
        ]
    )

    static let rockiesHybrid = Trip(
        id: "sample-hybrid",
        name: "Rockies fly & drive",
        travelMode: .hybrid,
        origin: Location(lat: 37.6213, lng: -122.3790, name: "San Francisco"),
        destination: Location(lat: 40.7899, lng: -111.9791, name: "Salt Lake City"),
        legs: [
            TripLeg(
                id: "hy-fly-in",
                transport: .flight,
                from: Location(lat: 37.6213, lng: -122.3790, name: "SFO"),
                to: Location(lat: 39.8561, lng: -104.6737, name: "DEN"),
                estimatedCost: 148
            ),
            TripLeg(
                id: "hy-drive",
                transport: .drive,
                from: Location(lat: 39.7392, lng: -104.9903, name: "Denver"),
                to: Location(lat: 40.7608, lng: -111.8910, name: "Salt Lake City"),
                estimatedCost: 220
            ),
            TripLeg(
                id: "hy-fly-out",
                transport: .flight,
                from: Location(lat: 40.7899, lng: -111.9791, name: "SLC"),
                to: Location(lat: 37.6213, lng: -122.3790, name: "SFO"),
                estimatedCost: 132
            )
        ],
        startDate: "2026-09-12",
        endDate: "2026-09-20",
        tripType: .solo,
        budget: 1600,
        status: .upcoming,
        participants: [Participant(id: "you", name: "You")]
    )
}
