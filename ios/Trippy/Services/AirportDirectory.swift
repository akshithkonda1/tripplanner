import Foundation

struct BundledAirport: Identifiable, Hashable {
    var id: String { iata }
    var iata: String
    var city: String
    var name: String
}

enum AirportDirectory {
    static let all: [BundledAirport] = [
        .init(iata: "SFO", city: "San Francisco", name: "San Francisco International"),
        .init(iata: "OAK", city: "Oakland", name: "Oakland International"),
        .init(iata: "LAX", city: "Los Angeles", name: "Los Angeles International"),
        .init(iata: "SAN", city: "San Diego", name: "San Diego International"),
        .init(iata: "SEA", city: "Seattle", name: "Seattle-Tacoma"),
        .init(iata: "PDX", city: "Portland", name: "Portland International"),
        .init(iata: "DEN", city: "Denver", name: "Denver International"),
        .init(iata: "SLC", city: "Salt Lake City", name: "Salt Lake City International"),
        .init(iata: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor"),
        .init(iata: "LAS", city: "Las Vegas", name: "Harry Reid"),
        .init(iata: "ORD", city: "Chicago", name: "O'Hare"),
        .init(iata: "MDW", city: "Chicago", name: "Midway"),
        .init(iata: "JFK", city: "New York", name: "John F. Kennedy"),
        .init(iata: "EWR", city: "Newark", name: "Newark Liberty"),
        .init(iata: "LGA", city: "New York", name: "LaGuardia"),
        .init(iata: "BOS", city: "Boston", name: "Logan"),
        .init(iata: "IAD", city: "Washington", name: "Dulles"),
        .init(iata: "DCA", city: "Washington", name: "Reagan National"),
        .init(iata: "ATL", city: "Atlanta", name: "Hartsfield-Jackson"),
        .init(iata: "MIA", city: "Miami", name: "Miami International"),
        .init(iata: "DFW", city: "Dallas", name: "Dallas/Fort Worth"),
        .init(iata: "AUS", city: "Austin", name: "Austin-Bergstrom"),
        .init(iata: "HNL", city: "Honolulu", name: "Daniel K. Inouye"),
        .init(iata: "ANC", city: "Anchorage", name: "Ted Stevens"),
        .init(iata: "YYZ", city: "Toronto", name: "Pearson"),
        .init(iata: "YVR", city: "Vancouver", name: "Vancouver International"),
        .init(iata: "LHR", city: "London", name: "Heathrow"),
        .init(iata: "LGW", city: "London", name: "Gatwick"),
        .init(iata: "STN", city: "London", name: "Stansted"),
        .init(iata: "CDG", city: "Paris", name: "Charles de Gaulle"),
        .init(iata: "AMS", city: "Amsterdam", name: "Schiphol"),
        .init(iata: "FRA", city: "Frankfurt", name: "Frankfurt"),
        .init(iata: "FCO", city: "Rome", name: "Fiumicino"),
        .init(iata: "BCN", city: "Barcelona", name: "El Prat"),
        .init(iata: "MAD", city: "Madrid", name: "Barajas"),
        .init(iata: "LIS", city: "Lisbon", name: "Humberto Delgado"),
        .init(iata: "NRT", city: "Tokyo", name: "Narita"),
        .init(iata: "HND", city: "Tokyo", name: "Haneda"),
        .init(iata: "KIX", city: "Osaka", name: "Kansai"),
        .init(iata: "ICN", city: "Seoul", name: "Incheon"),
        .init(iata: "PEK", city: "Beijing", name: "Capital"),
        .init(iata: "PVG", city: "Shanghai", name: "Pudong"),
        .init(iata: "HKG", city: "Hong Kong", name: "Hong Kong International"),
        .init(iata: "SIN", city: "Singapore", name: "Changi"),
        .init(iata: "BKK", city: "Bangkok", name: "Suvarnabhumi"),
        .init(iata: "DEL", city: "Delhi", name: "Indira Gandhi"),
        .init(iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji"),
        .init(iata: "SYD", city: "Sydney", name: "Kingsford Smith"),
        .init(iata: "MEL", city: "Melbourne", name: "Tullamarine"),
        .init(iata: "AKL", city: "Auckland", name: "Auckland"),
        .init(iata: "MEX", city: "Mexico City", name: "Benito Juárez"),
        .init(iata: "GRU", city: "São Paulo", name: "Guarulhos"),
        .init(iata: "EZE", city: "Buenos Aires", name: "Ezeiza"),
        .init(iata: "JNB", city: "Johannesburg", name: "O. R. Tambo"),
        .init(iata: "CAI", city: "Cairo", name: "Cairo International"),
        .init(iata: "DXB", city: "Dubai", name: "Dubai International"),
        .init(iata: "DOH", city: "Doha", name: "Hamad"),
        .init(iata: "IST", city: "Istanbul", name: "Istanbul"),
        .init(iata: "KEF", city: "Reykjavík", name: "Keflavík"),
        .init(iata: "DUB", city: "Dublin", name: "Dublin"),
        .init(iata: "CPH", city: "Copenhagen", name: "Kastrup"),
        .init(iata: "ARN", city: "Stockholm", name: "Arlanda"),
        .init(iata: "HEL", city: "Helsinki", name: "Vantaa"),
        .init(iata: "WAW", city: "Warsaw", name: "Chopin"),
        .init(iata: "PRG", city: "Prague", name: "Václav Havel"),
        .init(iata: "VIE", city: "Vienna", name: "Schwechat"),
        .init(iata: "ZRH", city: "Zurich", name: "Zurich"),
        .init(iata: "GVA", city: "Geneva", name: "Geneva"),
        .init(iata: "MUC", city: "Munich", name: "Munich"),
        .init(iata: "BER", city: "Berlin", name: "Brandenburg"),
        .init(iata: "ATH", city: "Athens", name: "Eleftherios Venizelos"),
    ]

    static func search(_ query: String) -> [BundledAirport] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return Array(all.prefix(12)) }
        return all.filter {
            $0.iata.lowercased().contains(q)
                || $0.city.lowercased().contains(q)
                || $0.name.lowercased().contains(q)
        }
    }
}
