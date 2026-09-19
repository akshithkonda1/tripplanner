import Foundation

enum HackTag: String, Codable, Hashable {
    case nearbyAirport = "nearby_airport"
    case flexDates = "flex_dates"
    case midweek = "midweek"
    case oneWayPair = "one_way_pair"
    case openJaw = "open_jaw"
    case hiddenCity = "hidden_city"
    case packageCombo = "package_combo"
    case splitRooms = "split_rooms"
    case apartment = "apartment"

    var title: String {
        switch self {
        case .nearbyAirport: return "Nearby airport"
        case .flexDates: return "±3 days"
        case .midweek: return "Midweek"
        case .oneWayPair: return "One-way pair"
        case .openJaw: return "Open-jaw"
        case .hiddenCity: return "Hidden-city"
        case .packageCombo: return "Flight + hotel"
        case .splitRooms: return "Split rooms"
        case .apartment: return "Apartment"
        }
    }
}

let hiddenCityWarning =
    "Hidden-city / skiplag: no checked bags through. Skipping the last segment can void the rest of the ticket (including the return) and may violate the airline contract of carriage. Trippy only ranks the published fare — payment still happens on Booking.com."

struct StayListing: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var city: String
    var provider: String
    var stars: Double
    var guestRating: Double
    var totalPrice: Double
    var nights: Int
    var currency: String
    var checkoutUrl: String
    var photoUrl: String?
    var rooms: Int
    var propertyType: String
    var hackTags: [HackTag]
    var warning: String?
    var comboTotal: Double?
}

struct FlightListing: Identifiable, Codable, Hashable {
    var id: String
    var provider: String
    var from: String
    var to: String
    var via: String?
    var actualGetOff: String?
    var departDate: String
    var returnDate: String?
    var totalPrice: Double
    var currency: String
    var isOneWay: Bool
    var stops: Int
    var checkoutUrl: String
    var hackTags: [HackTag]
    var warning: String?
    var comboTotal: Double?
    var cabin: String
}

struct RankedStay: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var city: String
    var provider: String
    var stars: Double
    var guestRating: Double
    var totalPrice: Double
    var nights: Int
    var currency: String
    var checkoutUrl: String
    var photoUrl: String?
    var rooms: Int
    var propertyType: String
    var hackTags: [HackTag]
    var warning: String?
    var comboTotal: Double?
    var nightly: Double
    var perPersonNight: Double
    var quality: Double
    var fairNightly: Double
    var trippyValue: Double

    var bookURL: URL {
        URL(string: checkoutUrl) ?? URL(string: "https://www.booking.com")!
    }
}

struct RankedFlight: Identifiable, Codable, Hashable {
    var id: String
    var provider: String
    var from: String
    var to: String
    var via: String?
    var actualGetOff: String?
    var departDate: String
    var returnDate: String?
    var totalPrice: Double
    var currency: String
    var isOneWay: Bool
    var stops: Int
    var checkoutUrl: String
    var hackTags: [HackTag]
    var warning: String?
    var comboTotal: Double?
    var cabin: String
    var perPerson: Double
    var quality: Double
    var fairTotal: Double
    var trippyValue: Double

    var bookURL: URL {
        URL(string: checkoutUrl) ?? URL(string: "https://flights.booking.com")!
    }

    var routeLabel: String {
        if let getOff = actualGetOff {
            return "\(from) → \(to) · get off at \(getOff)"
        }
        if let via {
            return "\(from) → \(to) via \(via)"
        }
        return "\(from) → \(to)"
    }
}

struct RankedStaySearch: Codable, Hashable {
    var source: String
    var partySize: Int
    var nights: Int
    var bestValue: [RankedStay]
    var lowestTotal: [RankedStay]
    var travelHacks: [RankedStay]
}

struct RankedFlightSearch: Codable, Hashable {
    var source: String
    var partySize: Int
    var bestValue: [RankedFlight]
    var lowestTotal: [RankedFlight]
    var travelHacks: [RankedFlight]
}
