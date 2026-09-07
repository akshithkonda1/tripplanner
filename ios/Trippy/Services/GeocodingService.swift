import CoreLocation
import Foundation

/// Resolves a typed place name to real coordinates via Apple's geocoder (CoreLocation/MapKit —
/// the same on-device framework family the map already uses, not a third-party travel vendor).
enum GeocodingService {
    static func locate(_ query: String) async -> Location? {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        do {
            let placemarks = try await CLGeocoder().geocodeAddressString(trimmed)
            guard let coordinate = placemarks.first?.location?.coordinate else { return nil }
            return Location(
                lat: coordinate.latitude,
                lng: coordinate.longitude,
                name: trimmed,
                timeZoneIdentifier: placemarks.first?.timeZone?.identifier
            )
        } catch {
            return nil
        }
    }
}
