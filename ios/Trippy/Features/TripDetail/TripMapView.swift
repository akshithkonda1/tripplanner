import MapKit
import SwiftUI

struct TripMapView: View {
    let workspace: TripWorkspace

    var body: some View {
        let trip = workspace.trip
        let pins = annotations(for: trip)
        Map {
            ForEach(pins, id: \.name) { pin in
                Marker(pin.name, coordinate: pin.coordinate)
            }
            if pins.count >= 2 {
                MapPolyline(coordinates: pins.map(\.coordinate))
                    .stroke(TrippyTheme.color(for: trip.travelMode), lineWidth: 4)
            }
        }
        .overlay(alignment: .bottom) {
            Text(trip.travelMode == .flight
                 ? "MapKit only. The line is a sketch between pins — not a purchased flight path."
                 : "MapKit driving sketch. Fuel math is on the Fuel tab (your MPG × a price you type).")
                .font(.caption)
                .padding(10)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding()
        }
    }

    private func annotations(for trip: Trip) -> [(name: String, coordinate: CLLocationCoordinate2D)] {
        var points: [(String, CLLocationCoordinate2D)] = []
        if trip.origin.lat != 0 || trip.origin.lng != 0 {
            points.append((trip.origin.name, .init(latitude: trip.origin.lat, longitude: trip.origin.lng)))
        }
        for item in trip.itinerary.flatMap(\.items) where item.location.lat != 0 || item.location.lng != 0 {
            points.append((item.name, .init(latitude: item.location.lat, longitude: item.location.lng)))
        }
        if trip.destination.lat != 0 || trip.destination.lng != 0 {
            points.append((trip.destination.name, .init(latitude: trip.destination.lat, longitude: trip.destination.lng)))
        }
        if points.isEmpty {
            // Sample trips have real coordinates; user-typed cities may be 0,0 — still show a map.
            points = [
                (trip.origin.name, CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)),
                (trip.destination.name, CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437))
            ]
        }
        return points
    }
}
