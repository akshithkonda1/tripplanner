import Foundation
import SwiftData

@Model
final class WorkspaceRecord {
    @Attribute(.unique) var tripId: String
    var json: Data
    var updatedAt: Date

    init(tripId: String, json: Data, updatedAt: Date = Date()) {
        self.tripId = tripId
        self.json = json
        self.updatedAt = updatedAt
    }
}

enum WorkspaceCodec {
    static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()
}
