import Foundation

struct FlightHack: Identifiable {
    var id: String
    var provider: String
    var title: String
    var why: String
    var url: URL
    var isBooking: Bool
}

struct FlightHunt: Identifiable {
    var id: String
    var label: String
    var subtitle: String
    var hacks: [FlightHack]
}

enum TravelHacking {
    /// Booking.com first (cheapest sort), then everyone else.
    /// Legal consumer tricks only: nearby airports, flex dates, midweek, one-ways, open-jaw.
    static func searches(
        originQuery: String,
        destinationQuery: String,
        depart: Date,
        returnDate: Date?
    ) -> [FlightHack] {
        let origin = AirportDirectory.resolve(originQuery)
        let dest = AirportDirectory.resolve(destinationQuery)
        let fromCode = origin?.iata ?? iataHint(originQuery)
        let toCode = dest?.iata ?? iataHint(destinationQuery)
        guard fromCode.count == 3, toCode.count == 3 else { return [] }

        var hacks: [FlightHack] = []

        hacks.append(
            booking(
                id: "booking-exact",
                from: fromCode,
                to: toCode,
                depart: depart,
                back: returnDate,
                title: "Booking.com · \(fromCode) → \(toCode)",
                why: returnDate == nil
                    ? "One-way, sorted cheapest. We open Booking.com first."
                    : "Exact dates, sorted cheapest. Most flight inventory we open first."
            )
        )

        if let origin {
            for alt in AirportDirectory.nearby(to: origin).prefix(2) {
                hacks.append(
                    booking(
                        id: "booking-alt-origin-\(alt.iata)",
                        from: alt.iata,
                        to: toCode,
                        depart: depart,
                        back: returnDate,
                        title: "Booking.com · leave from \(alt.iata) (\(alt.city))",
                        why: "Nearby origin — sometimes much cheaper than \(fromCode)."
                    )
                )
            }
        }

        if let dest {
            for alt in AirportDirectory.nearby(to: dest).prefix(2) {
                hacks.append(
                    booking(
                        id: "booking-alt-dest-\(alt.iata)",
                        from: fromCode,
                        to: alt.iata,
                        depart: depart,
                        back: returnDate,
                        title: "Booking.com · fly into \(alt.iata) (\(alt.city))",
                        why: "Nearby arrival — same city, often a cheaper airport."
                    )
                )
            }
        }

        let flexOut = Calendar.current.date(byAdding: .day, value: -3, to: depart) ?? depart
        let flexBack = returnDate.flatMap { Calendar.current.date(byAdding: .day, value: 3, to: $0) }
        hacks.append(
            booking(
                id: "booking-flex",
                from: fromCode,
                to: toCode,
                depart: flexOut,
                back: flexBack,
                title: "Booking.com · ±3 days",
                why: "Flexible window. The cheapest seat is rarely the first date you picked."
            )
        )

        let midOut = shiftToWeekday(depart, weekday: 3) // Tuesday
        let midBack = returnDate.map { shiftToWeekday($0, weekday: 4) } // Wednesday
        hacks.append(
            booking(
                id: "booking-midweek",
                from: fromCode,
                to: toCode,
                depart: midOut,
                back: midBack,
                title: "Booking.com · midweek",
                why: "Tue/Wed departures are often the cheapest days to fly."
            )
        )

        if let returnDate {
            hacks.append(
                booking(
                    id: "booking-ow-out",
                    from: fromCode,
                    to: toCode,
                    depart: depart,
                    back: nil,
                    title: "Booking.com · one-way out",
                    why: "Two one-ways can beat a round-trip on budget airlines."
                )
            )
            hacks.append(
                booking(
                    id: "booking-ow-home",
                    from: toCode,
                    to: fromCode,
                    depart: returnDate,
                    back: nil,
                    title: "Booking.com · one-way home",
                    why: "Pair with the outbound one-way and add the two prices."
                )
            )

            if let dest, let altHome = AirportDirectory.nearby(to: dest).first {
                hacks.append(
                    bookingOpenJaw(
                        id: "booking-openjaw",
                        outFrom: fromCode,
                        outTo: toCode,
                        homeFrom: altHome.iata,
                        homeTo: fromCode,
                        depart: depart,
                        back: returnDate,
                        title: "Booking.com · open-jaw via \(altHome.iata)",
                        why: "Fly into \(toCode), home from \(altHome.iata). Classic cheap-city trick."
                    )
                )
            }

            if let origin, let altHome = AirportDirectory.nearby(to: origin).first {
                hacks.append(
                    bookingOpenJaw(
                        id: "booking-return-nearby",
                        outFrom: fromCode,
                        outTo: toCode,
                        homeFrom: toCode,
                        homeTo: altHome.iata,
                        depart: depart,
                        back: returnDate,
                        title: "Booking.com · return to \(altHome.iata)",
                        why: "Land at a nearby home airport — sometimes half the price of \(fromCode)."
                    )
                )
            }
        }

        hacks.append(contentsOf: otherSites(from: fromCode, to: toCode, depart: depart, back: returnDate))
        return hacks
    }

    /// One hunt for a simple A→B trip; one hunt per air hop on hybrid / open-jaw.
    static func hunts(for trip: Trip) -> [FlightHunt] {
        let start = DateFormatters.iso.date(from: trip.startDate) ?? Date()
        let end = DateFormatters.iso.date(from: trip.endDate) ?? start
        let flightLegs = trip.legs.filter { $0.transport == .flight }

        if flightLegs.count >= 2 {
            var result: [FlightHunt] = []
            if let first = flightLegs.first, let last = flightLegs.last {
                let outFrom = first.from.name
                let outTo = first.to.name
                let homeFrom = last.from.name
                let homeTo = last.to.name
                let combined = searches(
                    originQuery: outFrom,
                    destinationQuery: outTo,
                    depart: start,
                    returnDate: nil
                )
                // Open-jaw home hop as its own Booking.com one-way, then the other OTAs for that hop.
                let homeHacks = searches(
                    originQuery: homeFrom,
                    destinationQuery: homeTo,
                    depart: end,
                    returnDate: nil
                )
                result.append(
                    FlightHunt(
                        id: "hop-out",
                        label: "Outbound hop",
                        subtitle: "Cheapest one-way in. Booking.com first.",
                        hacks: combined
                    )
                )
                result.append(
                    FlightHunt(
                        id: "hop-home",
                        label: "Home hop",
                        subtitle: "Cheapest one-way back. Booking.com first.",
                        hacks: homeHacks
                    )
                )
                if let origin = AirportDirectory.resolve(outFrom),
                   let dest = AirportDirectory.resolve(outTo),
                   let homeOrigin = AirportDirectory.resolve(homeFrom),
                   let homeDest = AirportDirectory.resolve(homeTo) {
                    result.insert(
                        FlightHunt(
                            id: "openjaw",
                            label: "Open-jaw (whole trip)",
                            subtitle: "One Booking.com multi-stop, cheapest sort.",
                            hacks: [
                                bookingOpenJaw(
                                    id: "booking-trip-openjaw",
                                    outFrom: origin.iata,
                                    outTo: dest.iata,
                                    homeFrom: homeOrigin.iata,
                                    homeTo: homeDest.iata,
                                    depart: start,
                                    back: end,
                                    title: "Booking.com · \(origin.iata)→\(dest.iata), \(homeOrigin.iata)→\(homeDest.iata)",
                                    why: "Fly in one city, home from another. Often cheaper than a forced round-trip."
                                )
                            ]
                        ),
                        at: 0
                    )
                }
            }
            return result
        }

        return [
            FlightHunt(
                id: "roundtrip",
                label: "Cheapest searches first",
                subtitle: "Booking.com cheapest, then the other sites.",
                hacks: searches(
                    originQuery: trip.origin.name,
                    destinationQuery: trip.destination.name,
                    depart: start,
                    returnDate: end
                )
            )
        ]
    }

    private static func otherSites(from: String, to: String, depart: Date, back: Date?) -> [FlightHack] {
        let d = iso(depart)
        let r = back.map(iso)
        let kayak: URL
        let google: URL
        let skyscanner: URL
        let momondo: URL
        if let r {
            kayak = url("https://www.kayak.com/flights/\(from)-\(to)/\(d)/\(r)?sort=price_a")
            google = url("https://www.google.com/travel/flights?q=Flights%20from%20\(from)%20to%20\(to)%20on%20\(d)%20through%20\(r)")
            skyscanner = url("https://www.skyscanner.com/transport/flights/\(from.lowercased())/\(to.lowercased())/\(compact(d))/\(compact(r))/?adultsv2=1&cabinclass=economy&sort=price")
            momondo = url("https://www.momondo.com/flight-search/\(from)-\(to)/\(d)/\(r)?sort=price")
        } else {
            kayak = url("https://www.kayak.com/flights/\(from)-\(to)/\(d)?sort=price_a")
            google = url("https://www.google.com/travel/flights?q=Flights%20from%20\(from)%20to%20\(to)%20on%20\(d)")
            skyscanner = url("https://www.skyscanner.com/transport/flights/\(from.lowercased())/\(to.lowercased())/\(compact(d))/?adultsv2=1&cabinclass=economy&sort=price")
            momondo = url("https://www.momondo.com/flight-search/\(from)-\(to)/\(d)?sort=price")
        }

        return [
            FlightHack(
                id: "kayak",
                provider: "Kayak",
                title: "Kayak · cheapest",
                why: "After Booking.com — another full catalog, price sort.",
                url: kayak,
                isBooking: false
            ),
            FlightHack(
                id: "google",
                provider: "Google Flights",
                title: "Google Flights · price grid",
                why: "See the calendar of cheap days, then jump back to Booking.com to book.",
                url: google,
                isBooking: false
            ),
            FlightHack(
                id: "skyscanner",
                provider: "Skyscanner",
                title: "Skyscanner · everywhere-style",
                why: "Good for catching a budget airline Booking.com sometimes buries.",
                url: skyscanner,
                isBooking: false
            ),
            FlightHack(
                id: "momondo",
                provider: "Momondo",
                title: "Momondo · cheapest",
                why: "Last pass for a fare the others hid.",
                url: momondo,
                isBooking: false
            )
        ]
    }

    private static func booking(
        id: String,
        from: String,
        to: String,
        depart: Date,
        back: Date?,
        title: String,
        why: String
    ) -> FlightHack {
        let type = back == nil ? "ONEWAY" : "ROUNDTRIP"
        var path = "https://flights.booking.com/flights/\(from).AIRPORT-\(to).AIRPORT/?type=\(type)&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=\(iso(depart))"
        if let back {
            path += "&return=\(iso(back))"
        }
        return FlightHack(
            id: id,
            provider: "Booking.com",
            title: title,
            why: why,
            url: url(path),
            isBooking: true
        )
    }

    private static func bookingOpenJaw(
        id: String,
        outFrom: String,
        outTo: String,
        homeFrom: String,
        homeTo: String,
        depart: Date,
        back: Date,
        title: String,
        why: String
    ) -> FlightHack {
        let path = "https://flights.booking.com/flights/\(outFrom).AIRPORT-\(outTo).AIRPORT/\(homeFrom).AIRPORT-\(homeTo).AIRPORT/?type=MULTISTOP&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=\(iso(depart))&return=\(iso(back))"
        return FlightHack(
            id: id,
            provider: "Booking.com",
            title: title,
            why: why,
            url: url(path),
            isBooking: true
        )
    }

    static func shiftToWeekday(_ date: Date, weekday: Int) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.locale = Locale(identifier: "en_US_POSIX")
        let current = cal.component(.weekday, from: date)
        let delta = (weekday - current + 7) % 7
        return cal.date(byAdding: .day, value: delta, to: date) ?? date
    }

    private static func iataHint(_ raw: String) -> String {
        let token = raw.split { !$0.isLetter && !$0.isNumber }.first.map(String.init) ?? raw
        return token.count == 3 ? token.uppercased() : ""
    }

    private static func iso(_ date: Date) -> String {
        DateFormatters.iso.string(from: date)
    }

    private static func compact(_ iso: String) -> String {
        iso.replacingOccurrences(of: "-", with: "").suffix(6).description
    }

    private static func url(_ string: String) -> URL {
        URL(string: string) ?? URL(string: "https://flights.booking.com")!
    }
}
