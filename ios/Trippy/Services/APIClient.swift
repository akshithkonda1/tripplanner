import Foundation

struct APIConfiguration {
    static var httpBaseURL = ProcessInfo.processInfo.environment["HTTP_API_URL"]
        ?? "https://your-api.execute-api.us-east-1.amazonaws.com"
    static var webSocketURL = ProcessInfo.processInfo.environment["WS_API_URL"]
        ?? "wss://your-ws-api.execute-api.us-east-1.amazonaws.com/production"

    static var isConfigured: Bool {
        !httpBaseURL.contains("your-api.execute-api")
    }
}

enum APIError: Error {
    case notConfigured
    case unauthorized
    case badResponse
}

actor APIClient {
    static let shared = APIClient()

    func createTrip(_ request: CreateTripRequest, idToken: String?) async throws -> Trip {
        try await post("/trips", body: request, decode: Envelope<Trip>.self, idToken: idToken).trip
    }

    func listTrips(idToken: String?) async throws -> [Trip] {
        try await get("/trips", decode: TripList.self, idToken: idToken).trips
    }

    func planTrip(id: String, message: String, travelMode: TravelMode, idToken: String?) async throws -> Data {
        struct Body: Encodable {
            var message: String
            var travelMode: TravelMode
        }
        return try await postRaw("/trips/\(id)/plan", body: Body(message: message, travelMode: travelMode), idToken: idToken)
    }

    private struct Envelope<T: Decodable>: Decodable { var trip: T }
    private struct TripList: Decodable { var trips: [Trip] }

    private func get<T: Decodable>(_ path: String, decode: T.Type, idToken: String?) async throws -> T {
        try await send(path, method: "GET", body: nil, decode: decode, idToken: idToken)
    }

    private func post<Body: Encodable, T: Decodable>(_ path: String, body: Body, decode: T.Type, idToken: String?) async throws -> T {
        let data = try JSONEncoder().encode(body)
        return try await send(path, method: "POST", body: data, decode: decode, idToken: idToken)
    }

    private func postRaw<Body: Encodable>(_ path: String, body: Body, idToken: String?) async throws -> Data {
        try await sendRaw(path, method: "POST", body: try JSONEncoder().encode(body), idToken: idToken)
    }

    private func send<T: Decodable>(_ path: String, method: String, body: Data?, decode: T.Type, idToken: String?) async throws -> T {
        let data = try await sendRaw(path, method: method, body: body, idToken: idToken)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func sendRaw(_ path: String, method: String, body: Data?, idToken: String?) async throws -> Data {
        guard APIConfiguration.isConfigured else { throw APIError.notConfigured }
        guard let idToken, !idToken.isEmpty else { throw APIError.unauthorized }
        var req = URLRequest(url: URL(string: APIConfiguration.httpBaseURL + path)!)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = body
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APIError.badResponse
        }
        return data
    }
}
