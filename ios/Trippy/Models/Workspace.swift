import Foundation

struct Expense: Identifiable, Codable, Hashable {
    var id: String
    var tripId: String
    var amount: Decimal
    var currency: String
    var category: ExpenseCategory
    var paidBy: String
    var splitAmong: [String]
    var note: String
    var date: String
}

struct PackingItem: Identifiable, Codable, Hashable {
    var id: String
    var label: String
    var packed: Bool
}

struct TravelDocument: Identifiable, Codable, Hashable {
    var id: String
    var title: String
    var detail: String
    var done: Bool
}

struct VehicleProfile: Codable, Hashable {
    var name: String
    var mpg: Double
    var fuelPricePerGallon: Decimal
}

struct ManualFlight: Identifiable, Codable, Hashable {
    var id: String
    var airline: String
    var flightNumber: String
    var confirmationCode: String
    var fromCode: String
    var fromCity: String
    var toCode: String
    var toCity: String
    var departDate: String
    var departTime: String
    var arriveDate: String
    var arriveTime: String
    var cabin: String
    var bags: String
    var cost: Decimal?
}

struct TripWorkspace: Codable, Hashable {
    var trip: Trip
    var expenses: [Expense]
    var messages: [ChatMessage]
    var packing: [PackingItem]
    var documents: [TravelDocument]
    var flights: [ManualFlight]
    var vehicle: VehicleProfile
    var stayNotes: [StayNote]
}

struct StayNote: Identifiable, Codable, Hashable {
    var id: String
    var city: String
    var place: String
    var confirmation: String
    var nights: Int
    var cost: Decimal?
}

extension ExpenseCategory {
    var title: String {
        switch self {
        case .flights: return "Flights"
        case .fuel: return "Fuel"
        case .food: return "Food"
        case .lodging: return "Lodging"
        case .activities: return "Activities"
        case .transit: return "Transit"
        case .misc: return "Misc"
        }
    }
}

enum DateFormatters {
    static let iso: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
