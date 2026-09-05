import Foundation

enum FuelEstimator {
    static func miles(from: Location, to: Location) -> Double {
        haversineMiles(from.lat, from.lng, to.lat, to.lng)
    }

    static func estimate(trip: Trip, vehicle: VehicleProfile) -> Decimal {
        let driveLegs = trip.legs.filter { $0.transport == .drive }
        let hops: [(Location, Location)]
        if driveLegs.isEmpty, trip.travelMode != .flight {
            hops = [(trip.origin, trip.destination)]
        } else {
            hops = driveLegs.map { ($0.from, $0.to) }
        }
        let totalMiles = hops.reduce(0.0) { $0 + miles(from: $1.0, to: $1.1) }
        guard vehicle.mpg > 0 else { return 0 }
        let gallons = Decimal(totalMiles / vehicle.mpg)
        return gallons * vehicle.fuelPricePerGallon
    }

    static func haversineMiles(_ lat1: Double, _ lon1: Double, _ lat2: Double, _ lon2: Double) -> Double {
        let r = 3958.8
        let p1 = lat1 * .pi / 180
        let p2 = lat2 * .pi / 180
        let dPhi = (lat2 - lat1) * .pi / 180
        let dLam = (lon2 - lon1) * .pi / 180
        let a = sin(dPhi / 2) * sin(dPhi / 2) + cos(p1) * cos(p2) * sin(dLam / 2) * sin(dLam / 2)
        return 2 * r * atan2(sqrt(a), sqrt(1 - a))
    }
}
