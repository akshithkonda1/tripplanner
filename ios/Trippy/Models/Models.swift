import Foundation

enum TravelMode: String, Codable, CaseIterable, Identifiable {
    case road, flight, hybrid
    var id: String { rawValue }

    var title: String {
        switch self {
        case .road: return "Road"
        case .flight: return "Flight"
        case .hybrid: return "Hybrid"
        }
    }

    var subtitle: String {
        switch self {
        case .road: return "Drive the whole way"
        case .flight: return "Longer trips, city hops, flights"
        case .hybrid: return "Fly in, explore on the ground, fly out"
        }
    }

    var systemImage: String {
        switch self {
        case .road: return "car.fill"
        case .flight: return "airplane"
        case .hybrid: return "point.topleft.down.to.point.bottomright.curvepath.fill"
        }
    }
}

enum TransportType: String, Codable, CaseIterable {
    case drive, flight, train, bus, ferry, transit, walk
}

enum TripType: String, Codable, CaseIterable, Identifiable {
    case solo, couple, family, friends
    var id: String { rawValue }
}

enum TripStatus: String, Codable {
    case planning, upcoming, active, completed
}

enum StopType: String, Codable {
    case drive, flight, food, lodging, activity, fuel, rest, transit
}

enum ExpenseCategory: String, Codable, CaseIterable {
    case flights, fuel, food, lodging, activities, transit, misc
}

enum MessageType: String, Codable {
    case user, samResponse = "sam_response", system
}

struct Location: Codable, Hashable {
    var lat: Double
    var lng: Double
    var name: String
    var timeZoneIdentifier: String?
}

struct Airport: Codable, Hashable {
    var iata: String
    var name: String
    var city: String
    var location: Location
}

struct FlightDetails: Codable, Hashable {
    var airline: String
    var flightNumber: String
    var confirmationCode: String?
    var originAirport: Airport
    var destinationAirport: Airport
    var cabin: String
    var bagsIncluded: Int
    var layoverMinutes: Int?
    var bookingURL: String?
}

struct TripLeg: Identifiable, Codable, Hashable {
    var id: String
    var transport: TransportType
    var from: Location
    var to: Location
    var departAt: Date?
    var arriveAt: Date?
    var estimatedCost: Decimal?
    var flight: FlightDetails?
}

struct ItineraryItem: Identifiable, Codable, Hashable {
    var id: String
    var type: StopType
    var name: String
    var location: Location
    var durationMinutes: Int
    var estimatedCost: Decimal?
    var currency: String?
    var notes: String?
    var isBooked: Bool
}

struct DayPlan: Identifiable, Codable, Hashable {
    var id: String
    var date: String
    var city: String?
    var items: [ItineraryItem]
}

struct Participant: Identifiable, Codable, Hashable {
    var id: String
    var name: String
}

struct Trip: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var travelMode: TravelMode
    var origin: Location
    var destination: Location
    var legs: [TripLeg]
    var startDate: String
    var endDate: String
    var datesFlexible: Bool
    var tripType: TripType
    var budget: Decimal?
    var homeCurrency: String
    var status: TripStatus
    var participants: [Participant]
    var itinerary: [DayPlan]

    enum CodingKeys: String, CodingKey {
        case id, name, travelMode, origin, destination, legs
        case startDate, endDate, datesFlexible, tripType, budget
        case homeCurrency, status, participants, itinerary
        case tripId, tripName
    }

    init(
        id: String,
        name: String,
        travelMode: TravelMode,
        origin: Location,
        destination: Location,
        legs: [TripLeg] = [],
        startDate: String,
        endDate: String,
        datesFlexible: Bool = false,
        tripType: TripType = .solo,
        budget: Decimal? = nil,
        homeCurrency: String = "USD",
        status: TripStatus = .planning,
        participants: [Participant] = [],
        itinerary: [DayPlan] = []
    ) {
        self.id = id
        self.name = name
        self.travelMode = travelMode
        self.origin = origin
        self.destination = destination
        self.legs = legs
        self.startDate = startDate
        self.endDate = endDate
        self.datesFlexible = datesFlexible
        self.tripType = tripType
        self.budget = budget
        self.homeCurrency = homeCurrency
        self.status = status
        self.participants = participants
        self.itinerary = itinerary
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(String.self, forKey: .id)
            ?? c.decodeIfPresent(String.self, forKey: .tripId)
            ?? UUID().uuidString
        name = try c.decodeIfPresent(String.self, forKey: .name)
            ?? c.decodeIfPresent(String.self, forKey: .tripName)
            ?? "Untitled trip"
        travelMode = try c.decodeIfPresent(TravelMode.self, forKey: .travelMode) ?? .road
        origin = try c.decode(Location.self, forKey: .origin)
        destination = try c.decode(Location.self, forKey: .destination)
        legs = try c.decodeIfPresent([TripLeg].self, forKey: .legs) ?? []
        startDate = try c.decode(String.self, forKey: .startDate)
        endDate = try c.decode(String.self, forKey: .endDate)
        datesFlexible = try c.decodeIfPresent(Bool.self, forKey: .datesFlexible) ?? false
        tripType = try c.decodeIfPresent(TripType.self, forKey: .tripType) ?? .solo
        budget = try c.decodeIfPresent(Decimal.self, forKey: .budget)
        homeCurrency = try c.decodeIfPresent(String.self, forKey: .homeCurrency) ?? "USD"
        status = try c.decodeIfPresent(TripStatus.self, forKey: .status) ?? .planning
        participants = try c.decodeIfPresent([Participant].self, forKey: .participants) ?? []
        itinerary = try c.decodeIfPresent([DayPlan].self, forKey: .itinerary) ?? []
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(travelMode, forKey: .travelMode)
        try c.encode(origin, forKey: .origin)
        try c.encode(destination, forKey: .destination)
        try c.encode(legs, forKey: .legs)
        try c.encode(startDate, forKey: .startDate)
        try c.encode(endDate, forKey: .endDate)
        try c.encode(datesFlexible, forKey: .datesFlexible)
        try c.encode(tripType, forKey: .tripType)
        try c.encodeIfPresent(budget, forKey: .budget)
        try c.encode(homeCurrency, forKey: .homeCurrency)
        try c.encode(status, forKey: .status)
        try c.encode(participants, forKey: .participants)
        try c.encode(itinerary, forKey: .itinerary)
    }

    var dateRangeLabel: String {
        "\(Self.prettyDate(startDate)) – \(Self.prettyDate(endDate))"
    }

    var routeLabel: String {
        "\(origin.name) → \(destination.name)"
    }

    private static func prettyDate(_ iso: String) -> String {
        let inFmt = DateFormatter()
        inFmt.calendar = Calendar(identifier: .gregorian)
        inFmt.locale = Locale(identifier: "en_US_POSIX")
        inFmt.dateFormat = "yyyy-MM-dd"
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MMM d"
        guard let date = inFmt.date(from: iso) else { return iso }
        return outFmt.string(from: date)
    }
}

struct ChatMessage: Identifiable, Codable, Hashable {
    var id: String
    var tripId: String
    var userId: String
    var message: String
    var timestamp: Date
    var type: MessageType
}

struct CreateTripRequest: Codable {
    var tripName: String
    var travelMode: TravelMode
    var origin: Location
    var destination: Location
    var legs: [TripLeg]
    var startDate: String
    var endDate: String
    var datesFlexible: Bool
    var tripType: TripType
    var preferences: Preferences
    var homeCurrency: String

    struct Preferences: Codable {
        var budget: Double?
    }
}
