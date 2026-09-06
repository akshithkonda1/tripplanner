import Foundation

struct BundledAirport: Identifiable, Hashable {
    var id: String { iata }
    var iata: String
    var city: String
    var name: String
    var lat: Double
    var lng: Double

    var location: Location {
        Location(lat: lat, lng: lng, name: "\(iata) \(city)")
    }
}

enum AirportDirectory {
    static let all: [BundledAirport] = [
        .init(iata: "SFO", city: "San Francisco", name: "San Francisco International", lat: 37.6213, lng: -122.3790),
        .init(iata: "OAK", city: "Oakland", name: "Oakland International", lat: 37.7126, lng: -122.2197),
        .init(iata: "LAX", city: "Los Angeles", name: "Los Angeles International", lat: 33.9416, lng: -118.4085),
        .init(iata: "SAN", city: "San Diego", name: "San Diego International", lat: 32.7338, lng: -117.1933),
        .init(iata: "SEA", city: "Seattle", name: "Seattle-Tacoma", lat: 47.4502, lng: -122.3088),
        .init(iata: "PDX", city: "Portland", name: "Portland International", lat: 45.5898, lng: -122.5951),
        .init(iata: "DEN", city: "Denver", name: "Denver International", lat: 39.8561, lng: -104.6737),
        .init(iata: "SLC", city: "Salt Lake City", name: "Salt Lake City International", lat: 40.7899, lng: -111.9791),
        .init(iata: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor", lat: 33.4352, lng: -112.0101),
        .init(iata: "LAS", city: "Las Vegas", name: "Harry Reid", lat: 36.0840, lng: -115.1537),
        .init(iata: "ORD", city: "Chicago", name: "O'Hare", lat: 41.9742, lng: -87.9073),
        .init(iata: "MDW", city: "Chicago", name: "Midway", lat: 41.7868, lng: -87.7522),
        .init(iata: "JFK", city: "New York", name: "John F. Kennedy", lat: 40.6413, lng: -73.7781),
        .init(iata: "EWR", city: "Newark", name: "Newark Liberty", lat: 40.6895, lng: -74.1745),
        .init(iata: "LGA", city: "New York", name: "LaGuardia", lat: 40.7769, lng: -73.8740),
        .init(iata: "BOS", city: "Boston", name: "Logan", lat: 42.3656, lng: -71.0096),
        .init(iata: "IAD", city: "Washington", name: "Dulles", lat: 38.9531, lng: -77.4565),
        .init(iata: "DCA", city: "Washington", name: "Reagan National", lat: 38.8512, lng: -77.0402),
        .init(iata: "ATL", city: "Atlanta", name: "Hartsfield-Jackson", lat: 33.6407, lng: -84.4277),
        .init(iata: "MIA", city: "Miami", name: "Miami International", lat: 25.7959, lng: -80.2870),
        .init(iata: "DFW", city: "Dallas", name: "Dallas/Fort Worth", lat: 32.8998, lng: -97.0403),
        .init(iata: "AUS", city: "Austin", name: "Austin-Bergstrom", lat: 30.1975, lng: -97.6664),
        .init(iata: "HNL", city: "Honolulu", name: "Daniel K. Inouye", lat: 21.3245, lng: -157.9251),
        .init(iata: "ANC", city: "Anchorage", name: "Ted Stevens", lat: 61.1743, lng: -149.9962),
        .init(iata: "YYZ", city: "Toronto", name: "Pearson", lat: 43.6777, lng: -79.6248),
        .init(iata: "YVR", city: "Vancouver", name: "Vancouver International", lat: 49.1967, lng: -123.1815),
        .init(iata: "LHR", city: "London", name: "Heathrow", lat: 51.4700, lng: -0.4543),
        .init(iata: "LGW", city: "London", name: "Gatwick", lat: 51.1537, lng: -0.1821),
        .init(iata: "STN", city: "London", name: "Stansted", lat: 51.8860, lng: 0.2389),
        .init(iata: "CDG", city: "Paris", name: "Charles de Gaulle", lat: 49.0097, lng: 2.5479),
        .init(iata: "AMS", city: "Amsterdam", name: "Schiphol", lat: 52.3105, lng: 4.7683),
        .init(iata: "FRA", city: "Frankfurt", name: "Frankfurt", lat: 50.0379, lng: 8.5622),
        .init(iata: "FCO", city: "Rome", name: "Fiumicino", lat: 41.8003, lng: 12.2389),
        .init(iata: "BCN", city: "Barcelona", name: "El Prat", lat: 41.2974, lng: 2.0833),
        .init(iata: "MAD", city: "Madrid", name: "Barajas", lat: 40.4983, lng: -3.5676),
        .init(iata: "LIS", city: "Lisbon", name: "Humberto Delgado", lat: 38.7813, lng: -9.1359),
        .init(iata: "NRT", city: "Tokyo", name: "Narita", lat: 35.7720, lng: 140.3929),
        .init(iata: "HND", city: "Tokyo", name: "Haneda", lat: 35.5494, lng: 139.7798),
        .init(iata: "KIX", city: "Osaka", name: "Kansai", lat: 34.4347, lng: 135.2440),
        .init(iata: "ICN", city: "Seoul", name: "Incheon", lat: 37.4602, lng: 126.4407),
        .init(iata: "PEK", city: "Beijing", name: "Capital", lat: 40.0799, lng: 116.6031),
        .init(iata: "PVG", city: "Shanghai", name: "Pudong", lat: 31.1443, lng: 121.8083),
        .init(iata: "HKG", city: "Hong Kong", name: "Hong Kong International", lat: 22.3080, lng: 113.9185),
        .init(iata: "SIN", city: "Singapore", name: "Changi", lat: 1.3644, lng: 103.9915),
        .init(iata: "BKK", city: "Bangkok", name: "Suvarnabhumi", lat: 13.6900, lng: 100.7501),
        .init(iata: "DEL", city: "Delhi", name: "Indira Gandhi", lat: 28.5562, lng: 77.1000),
        .init(iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji", lat: 19.0896, lng: 72.8656),
        .init(iata: "SYD", city: "Sydney", name: "Kingsford Smith", lat: -33.9399, lng: 151.1753),
        .init(iata: "MEL", city: "Melbourne", name: "Tullamarine", lat: -37.6690, lng: 144.8410),
        .init(iata: "AKL", city: "Auckland", name: "Auckland", lat: -37.0082, lng: 174.7850),
        .init(iata: "MEX", city: "Mexico City", name: "Benito Juárez", lat: 19.4363, lng: -99.0721),
        .init(iata: "GRU", city: "São Paulo", name: "Guarulhos", lat: -23.4356, lng: -46.4731),
        .init(iata: "EZE", city: "Buenos Aires", name: "Ezeiza", lat: -34.8222, lng: -58.5358),
        .init(iata: "JNB", city: "Johannesburg", name: "O. R. Tambo", lat: -26.1392, lng: 28.2460),
        .init(iata: "CAI", city: "Cairo", name: "Cairo International", lat: 30.1219, lng: 31.4056),
        .init(iata: "DXB", city: "Dubai", name: "Dubai International", lat: 25.2532, lng: 55.3657),
        .init(iata: "DOH", city: "Doha", name: "Hamad", lat: 25.2731, lng: 51.6081),
        .init(iata: "IST", city: "Istanbul", name: "Istanbul", lat: 41.2753, lng: 28.7519),
        .init(iata: "KEF", city: "Reykjavík", name: "Keflavík", lat: 63.9850, lng: -22.6056),
        .init(iata: "DUB", city: "Dublin", name: "Dublin", lat: 53.4213, lng: -6.2701),
        .init(iata: "CPH", city: "Copenhagen", name: "Kastrup", lat: 55.6180, lng: 12.6560),
        .init(iata: "ARN", city: "Stockholm", name: "Arlanda", lat: 59.6519, lng: 17.9186),
        .init(iata: "HEL", city: "Helsinki", name: "Vantaa", lat: 60.3172, lng: 24.9633),
        .init(iata: "WAW", city: "Warsaw", name: "Chopin", lat: 52.1657, lng: 20.9671),
        .init(iata: "PRG", city: "Prague", name: "Václav Havel", lat: 50.1008, lng: 14.2600),
        .init(iata: "VIE", city: "Vienna", name: "Schwechat", lat: 48.1103, lng: 16.5697),
        .init(iata: "ZRH", city: "Zurich", name: "Zurich", lat: 47.4647, lng: 8.5492),
        .init(iata: "GVA", city: "Geneva", name: "Geneva", lat: 46.2381, lng: 6.1089),
        .init(iata: "MUC", city: "Munich", name: "Munich", lat: 48.3538, lng: 11.7861),
        .init(iata: "BER", city: "Berlin", name: "Brandenburg", lat: 52.3667, lng: 13.5033),
        .init(iata: "ATH", city: "Athens", name: "Eleftherios Venizelos", lat: 37.9364, lng: 23.9445),
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
