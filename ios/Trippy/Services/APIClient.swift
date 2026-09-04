import Foundation

struct APIConfiguration {
    /// Replace with the CDK HTTP API URL when you deploy.
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
    case badResponse
}

/// Talks to the AWS HTTP API. Until a URL is configured the store keeps using sample trips.
actor APIClient {
    static let shared = APIClient()

    func createTrip(_ request: CreateTripRequest) async throws -> Trip {
        guard APIConfiguration.isConfigured else { throw APIError.notConfigured }
        var req = URLRequest(url: URL(string: APIConfiguration.httpBaseURL + "/trips")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(request)
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APIError.badResponse
        }
        struct Envelope: Decodable { var trip: Trip }
        return try JSONDecoder().decode(Envelope.self, from: data).trip
    }
}
