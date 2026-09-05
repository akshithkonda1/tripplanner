import Foundation

/// On-device Sam. No fare, hotel, gas, or weather vendors — just the trip you already typed.
enum LocalPlanner {
    static func reply(to text: String, workspace: TripWorkspace) -> String {
        let trip = workspace.trip
        switch trip.travelMode {
        case .flight:
            return """
            For \(trip.name) I’ll keep this as city stays, not driving days.
            You typed “\(text)”. Log the actual flights yourself on the Flights tab — we don’t buy or scrape fares.
            I’d linger longer in \(trip.origin.name) and \(trip.destination.name) unless you want a whirlwind.
            """
        case .hybrid:
            return """
            Hybrid: fly the long hops, drive the middle. “\(text)”
            Keep one budget. Add the real flight numbers on Flights and I’ll treat drive legs as road days.
            """
        case .road:
            return """
            Road mode: “\(text)”
            I can sketch driving days from \(trip.origin.name) to \(trip.destination.name) without calling a maps vendor for prices — MapKit draws the line, fuel is your MPG × a price you type.
            """
        }
    }

    static func seedItinerary(for trip: Trip) -> [DayPlan] {
        let start = DateFormatters.iso.date(from: trip.startDate) ?? Date()
        let end = DateFormatters.iso.date(from: trip.endDate) ?? start.addingTimeInterval(86_400 * 3)
        let days = max(1, Calendar.current.dateComponents([.day], from: start, to: end).day ?? 1)

        if trip.travelMode == .road {
            return (0..<min(days, 8)).map { offset in
                let date = Calendar.current.date(byAdding: .day, value: offset, to: start) ?? start
                let city = offset == 0 ? trip.origin.name : (offset == days - 1 ? trip.destination.name : "On the road")
                return DayPlan(
                    id: UUID().uuidString,
                    date: DateFormatters.iso.string(from: date),
                    city: city,
                    items: [
                        ItineraryItem(
                            id: UUID().uuidString,
                            type: offset == 0 ? .drive : .activity,
                            name: offset == 0 ? "Roll out of \(trip.origin.name)" : "Cheap stop / viewpoint",
                            location: offset == 0 ? trip.origin : trip.destination,
                            durationMinutes: offset == 0 ? 180 : 90,
                            estimatedCost: offset == 0 ? 20 : 12,
                            notes: "On-device sketch — move or delete anything.",
                            isBooked: false
                        )
                    ]
                )
            }
        }

        let cities = ([trip.origin.name] + trip.legs.map(\.to.name) + [trip.destination.name])
        let unique = Array(NSOrderedSet(array: cities)) as? [String] ?? [trip.origin.name]
        return unique.prefix(max(1, min(unique.count, days))).enumerated().map { index, city in
            let date = Calendar.current.date(byAdding: .day, value: index, to: start) ?? start
            return DayPlan(
                id: UUID().uuidString,
                date: DateFormatters.iso.string(from: date),
                city: city,
                items: [
                    ItineraryItem(
                        id: UUID().uuidString,
                        type: index == 0 ? .flight : .activity,
                        name: index == 0 ? "Arrive / settle in \(city)" : "Walk \(city) on a shoestring",
                        location: index == 0 ? trip.origin : trip.destination,
                        durationMinutes: 240,
                        notes: "City stay — no fare API. Add your real flight on the Flights tab.",
                        isBooked: false
                    )
                ]
            )
        }
    }

    static func defaultPacking(for trip: Trip) -> [PackingItem] {
        var items = ["Passport / ID", "Chargers", "Reusable bottle", "Snacks for the first day"]
        if trip.travelMode != .road {
            items += ["Carry-on only if you can", "Printed or screenshot confirmations", "Local cash envelope"]
        } else {
            items += ["Spare fuel can if you’re remote", "Paper atlas / offline maps", "Camp chair"]
        }
        return items.map { PackingItem(id: UUID().uuidString, label: $0, packed: false) }
    }

    static func defaultDocuments(for trip: Trip) -> [TravelDocument] {
        if trip.travelMode == .road {
            return [
                TravelDocument(id: UUID().uuidString, title: "License & registration", detail: "In the car, not just on your phone.", done: false)
            ]
        }
        return [
            TravelDocument(id: UUID().uuidString, title: "Passport validity", detail: "Many places want 6 months left. Check the official site yourself.", done: false),
            TravelDocument(id: UUID().uuidString, title: "Entry / ETA", detail: "Look up the destination government site. Trippy does not file visas.", done: false)
        ]
    }
}
