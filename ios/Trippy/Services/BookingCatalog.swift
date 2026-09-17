import Foundation

enum BookingCatalog {
    static func stays(city: String, checkIn: String, checkOut: String, adults: Int) -> [StayListing] {
        let nights = max(1, nightsBetween(checkIn, checkOut))
        let party = max(1, adults)
        let scale = Double(nights) / 3.0
        let sameBlock = (1000 * scale).rounded()
        let q = city.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? city

        func url(_ slug: String) -> String {
            "https://www.booking.com/searchresults.html?ss=\(q)&checkin=\(checkIn)&checkout=\(checkOut)&group_adults=\(party)&no_rooms=1&order=price#\(slug)"
        }

        let raw: [StayListing] = [
            StayListing(id: "stay-3star", name: "\(city) 3-star", city: city, provider: "Booking.com", stars: 3, guestRating: 7.2, totalPrice: sameBlock, nights: nights, currency: "USD", checkoutUrl: url("3star"), photoUrl: nil, rooms: 1, propertyType: "hotel", hackTags: [], warning: nil, comboTotal: nil),
            StayListing(id: "stay-5star", name: "\(city) 5-star palace", city: city, provider: "Booking.com", stars: 5, guestRating: 9.1, totalPrice: sameBlock, nights: nights, currency: "USD", checkoutUrl: url("5star"), photoUrl: nil, rooms: 1, propertyType: "hotel", hackTags: [], warning: nil, comboTotal: nil),
            StayListing(id: "stay-hostel", name: "\(city) hostel dorm", city: city, provider: "Booking.com", stars: 3, guestRating: 8.4, totalPrice: Double(40 * nights), nights: nights, currency: "USD", checkoutUrl: url("hostel"), photoUrl: nil, rooms: 1, propertyType: "hostel", hackTags: [], warning: nil, comboTotal: nil),
            StayListing(id: "stay-apt", name: "\(city) 2-bed apartment", city: city, provider: "Booking.com", stars: 4, guestRating: 8.8, totalPrice: Double(180 * nights), nights: nights, currency: "USD", checkoutUrl: url("apt"), photoUrl: nil, rooms: 2, propertyType: "apartment", hackTags: [.apartment], warning: nil, comboTotal: nil),
            StayListing(id: "stay-split", name: "\(city) two hotel rooms", city: city, provider: "Booking.com", stars: 3, guestRating: 7.5, totalPrice: Double(220 * nights), nights: nights, currency: "USD", checkoutUrl: url("tworooms"), photoUrl: nil, rooms: 2, propertyType: "hotel", hackTags: [.splitRooms], warning: nil, comboTotal: nil),
            StayListing(id: "stay-package", name: "\(city) flight + hotel package", city: city, provider: "Booking.com", stars: 4, guestRating: 8.2, totalPrice: (760 * scale).rounded(), nights: nights, currency: "USD", checkoutUrl: url("package"), photoUrl: nil, rooms: 1, propertyType: "hotel", hackTags: [.packageCombo], warning: nil, comboTotal: (760 * scale).rounded()),
            StayListing(id: "stay-camp", name: "Camp near \(city)", city: city, provider: "Booking.com", stars: 1, guestRating: 8, totalPrice: Double(18 * nights), nights: nights, currency: "USD", checkoutUrl: url("camp"), photoUrl: nil, rooms: 1, propertyType: "camp", hackTags: [], warning: nil, comboTotal: nil)
        ]
        return raw.map { TravelHacking.tagStay($0, partySize: party) }
    }

    static func flights(from originQuery: String, to destQuery: String, depart: String, returnDate: String?, adults: Int) -> [FlightListing] {
        let origin = AirportDirectory.resolve(originQuery)
        let dest = AirportDirectory.resolve(destQuery)
        let from = origin?.iata ?? iataHint(originQuery)
        let to = dest?.iata ?? iataHint(destQuery)
        guard from.count == 3, to.count == 3 else { return [] }
        let party = max(1, adults)
        let published = 640.0 * Double(party)
        let departDate = DateFormatters.iso.date(from: depart) ?? Date()
        let backDate = returnDate.flatMap { DateFormatters.iso.date(from: $0) }

        var listings: [FlightListing] = [
            FlightListing(
                id: "flight-exact",
                provider: "Booking.com",
                from: from,
                to: to,
                via: nil,
                actualGetOff: nil,
                departDate: depart,
                returnDate: returnDate,
                totalPrice: published,
                currency: "USD",
                isOneWay: backDate == nil,
                stops: 0,
                checkoutUrl: bookingURL(from: from, to: to, depart: departDate, back: backDate),
                hackTags: [],
                warning: nil,
                comboTotal: nil,
                cabin: "economy"
            )
        ]

        if let origin {
            for alt in AirportDirectory.nearby(to: origin).prefix(2) {
                listings.append(
                    FlightListing(
                        id: "flight-alt-origin-\(alt.iata)",
                        provider: "Booking.com",
                        from: alt.iata,
                        to: to,
                        via: nil,
                        actualGetOff: nil,
                        departDate: depart,
                        returnDate: returnDate,
                        totalPrice: (published * 0.78).rounded(),
                        currency: "USD",
                        isOneWay: backDate == nil,
                        stops: 0,
                        checkoutUrl: bookingURL(from: alt.iata, to: to, depart: departDate, back: backDate),
                        hackTags: [.nearbyAirport],
                        warning: nil,
                        comboTotal: nil,
                        cabin: "economy"
                    )
                )
            }
        }

        if let dest, let alt = AirportDirectory.nearby(to: dest).first {
            listings.append(
                FlightListing(
                    id: "flight-alt-dest-\(alt.iata)",
                    provider: "Booking.com",
                    from: from,
                    to: alt.iata,
                    via: nil,
                    actualGetOff: nil,
                    departDate: depart,
                    returnDate: returnDate,
                    totalPrice: (published * 0.82).rounded(),
                    currency: "USD",
                    isOneWay: backDate == nil,
                    stops: 0,
                    checkoutUrl: bookingURL(from: from, to: alt.iata, depart: departDate, back: backDate),
                    hackTags: [.nearbyAirport],
                    warning: nil,
                    comboTotal: nil,
                    cabin: "economy"
                )
            )
        }

        let flexOut = Calendar.current.date(byAdding: .day, value: -3, to: departDate) ?? departDate
        let flexBack = backDate.flatMap { Calendar.current.date(byAdding: .day, value: 3, to: $0) }
        listings.append(
            FlightListing(
                id: "flight-flex",
                provider: "Booking.com",
                from: from,
                to: to,
                via: nil,
                actualGetOff: nil,
                departDate: DateFormatters.iso.string(from: flexOut),
                returnDate: flexBack.map { DateFormatters.iso.string(from: $0) },
                totalPrice: (published * 0.71).rounded(),
                currency: "USD",
                isOneWay: flexBack == nil,
                stops: 0,
                checkoutUrl: bookingURL(from: from, to: to, depart: flexOut, back: flexBack),
                hackTags: [.flexDates],
                warning: nil,
                comboTotal: nil,
                cabin: "economy"
            )
        )

        let midOut = TravelHacking.shiftToWeekday(departDate, weekday: 3)
        let midBack = backDate.map { TravelHacking.shiftToWeekday($0, weekday: 4) }
        listings.append(
            FlightListing(
                id: "flight-midweek",
                provider: "Booking.com",
                from: from,
                to: to,
                via: nil,
                actualGetOff: nil,
                departDate: DateFormatters.iso.string(from: midOut),
                returnDate: midBack.map { DateFormatters.iso.string(from: $0) },
                totalPrice: (published * 0.74).rounded(),
                currency: "USD",
                isOneWay: midBack == nil,
                stops: 0,
                checkoutUrl: bookingURL(from: from, to: to, depart: midOut, back: midBack),
                hackTags: [.midweek],
                warning: nil,
                comboTotal: nil,
                cabin: "economy"
            )
        )

        if let backDate, let returnDate {
            let pair = (published * 0.38).rounded() + (published * 0.36).rounded()
            listings.append(
                FlightListing(
                    id: "flight-ow-pair",
                    provider: "Booking.com",
                    from: from,
                    to: to,
                    via: nil,
                    actualGetOff: nil,
                    departDate: depart,
                    returnDate: returnDate,
                    totalPrice: pair,
                    currency: "USD",
                    isOneWay: true,
                    stops: 0,
                    checkoutUrl: bookingURL(from: from, to: to, depart: departDate, back: nil),
                    hackTags: [.oneWayPair],
                    warning: nil,
                    comboTotal: pair,
                    cabin: "economy"
                )
            )
            if let dest, let alt = AirportDirectory.nearby(to: dest).first {
                listings.append(
                    FlightListing(
                        id: "flight-openjaw",
                        provider: "Booking.com",
                        from: from,
                        to: to,
                        via: alt.iata,
                        actualGetOff: nil,
                        departDate: depart,
                        returnDate: returnDate,
                        totalPrice: (published * 0.8).rounded(),
                        currency: "USD",
                        isOneWay: false,
                        stops: 0,
                        checkoutUrl: openJawURL(outFrom: from, outTo: to, homeFrom: alt.iata, homeTo: from, depart: departDate, back: backDate),
                        hackTags: [.openJaw],
                        warning: nil,
                        comboTotal: nil,
                        cabin: "economy"
                    )
                )
            }
        }

        let beyond = TravelHacking.hiddenCityBeyond(to)
        listings.append(
            FlightListing(
                id: "flight-hidden-city",
                provider: "Booking.com",
                from: from,
                to: beyond,
                via: to,
                actualGetOff: to,
                departDate: depart,
                returnDate: returnDate,
                totalPrice: (published * 0.58).rounded(),
                currency: "USD",
                isOneWay: backDate == nil,
                stops: 1,
                checkoutUrl: bookingURL(from: from, to: beyond, depart: departDate, back: backDate),
                hackTags: [.hiddenCity],
                warning: hiddenCityWarning,
                comboTotal: nil,
                cabin: "economy"
            )
        )

        let requested = (from: from, to: to, depart: depart, returnDate: returnDate)
        return listings.map { TravelHacking.tagFlight($0, requested: requested) }
    }

    static func localStaySearch(city: String, checkIn: String, checkOut: String, adults: Int) -> RankedStaySearch {
        ValueRanker.staySearch(stays(city: city, checkIn: checkIn, checkOut: checkOut, adults: adults), partySize: adults)
    }

    static func localFlightSearch(from: String, to: String, depart: String, returnDate: String?, adults: Int) -> RankedFlightSearch {
        ValueRanker.flightSearch(flights(from: from, to: to, depart: depart, returnDate: returnDate, adults: adults), partySize: adults)
    }

    private static func nightsBetween(_ checkIn: String, _ checkOut: String) -> Int {
        guard let a = DateFormatters.iso.date(from: checkIn),
              let b = DateFormatters.iso.date(from: checkOut) else { return 1 }
        let days = Calendar.current.dateComponents([.day], from: a, to: b).day ?? 1
        return max(1, days)
    }

    private static func iataHint(_ raw: String) -> String {
        let token = raw.split { !$0.isLetter && !$0.isNumber }.first.map(String.init) ?? raw
        return token.count == 3 ? token.uppercased() : ""
    }

    private static func bookingURL(from: String, to: String, depart: Date, back: Date?) -> String {
        let type = back == nil ? "ONEWAY" : "ROUNDTRIP"
        var path = "https://flights.booking.com/flights/\(from).AIRPORT-\(to).AIRPORT/?type=\(type)&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=\(DateFormatters.iso.string(from: depart))"
        if let back {
            path += "&return=\(DateFormatters.iso.string(from: back))"
        }
        return path
    }

    private static func openJawURL(outFrom: String, outTo: String, homeFrom: String, homeTo: String, depart: Date, back: Date) -> String {
        "https://flights.booking.com/flights/\(outFrom).AIRPORT-\(outTo).AIRPORT/\(homeFrom).AIRPORT-\(homeTo).AIRPORT/?type=MULTISTOP&adults=1&cabinClass=ECONOMY&sort=CHEAPEST&depart=\(DateFormatters.iso.string(from: depart))&return=\(DateFormatters.iso.string(from: back))"
    }
}
