import Foundation

enum ValueRanker {
    static let stayBaseline = 150.0
    static let flightBaseline = 400.0

    static func stayQuality(stars: Double, guestRating: Double) -> Double {
        let star = min(5, max(0, stars)) / 5
        let guest = min(10, max(0, guestRating)) / 10
        return max(0.05, 0.65 * star + 0.35 * guest)
    }

    static func grade(_ listing: StayListing, partySize: Int, cityBaseline: Double = stayBaseline) -> RankedStay {
        let nights = max(1, listing.nights)
        let party = max(1, partySize)
        let total = max(listing.totalPrice, 0.01)
        let nightly = total / Double(nights)
        let perPersonNight = total / (Double(nights) * Double(party))
        let quality = stayQuality(stars: listing.stars, guestRating: listing.guestRating)
        let fairNightly = cityBaseline * (0.45 + 0.55 * quality)
        let trippyValue = (quality / perPersonNight) * (fairNightly / nightly)
        return RankedStay(
            id: listing.id,
            name: listing.name,
            city: listing.city,
            provider: listing.provider,
            stars: listing.stars,
            guestRating: listing.guestRating,
            totalPrice: listing.totalPrice,
            nights: nights,
            currency: listing.currency,
            checkoutUrl: listing.checkoutUrl,
            photoUrl: listing.photoUrl,
            rooms: listing.rooms,
            propertyType: listing.propertyType,
            hackTags: listing.hackTags,
            warning: listing.warning,
            comboTotal: listing.comboTotal,
            nightly: nightly,
            perPersonNight: perPersonNight,
            quality: quality,
            fairNightly: fairNightly,
            trippyValue: trippyValue
        )
    }

    static func grade(_ listing: FlightListing, partySize: Int, fareBaseline: Double = flightBaseline) -> RankedFlight {
        let party = max(1, partySize)
        let total = max(listing.totalPrice, 0.01)
        let perPerson = total / Double(party)
        var quality = listing.stops == 0 ? 1.0 : listing.stops == 1 ? 0.88 : 0.75
        if listing.hackTags.contains(.hiddenCity) {
            quality = min(quality, 0.72)
        }
        let fairTotal = fareBaseline * Double(party) * quality
        let trippyValue = (quality / perPerson) * (fairTotal / total)
        return RankedFlight(
            id: listing.id,
            provider: listing.provider,
            from: listing.from,
            to: listing.to,
            via: listing.via,
            actualGetOff: listing.actualGetOff,
            departDate: listing.departDate,
            returnDate: listing.returnDate,
            totalPrice: listing.totalPrice,
            currency: listing.currency,
            isOneWay: listing.isOneWay,
            stops: listing.stops,
            checkoutUrl: listing.checkoutUrl,
            hackTags: listing.hackTags,
            warning: listing.warning,
            comboTotal: listing.comboTotal,
            cabin: listing.cabin,
            perPerson: perPerson,
            quality: quality,
            fairTotal: fairTotal,
            trippyValue: trippyValue
        )
    }

    static func sortByValue(_ stays: [RankedStay]) -> [RankedStay] {
        stays.sorted { $0.trippyValue > $1.trippyValue }
    }

    static func sortByTotal(_ stays: [RankedStay]) -> [RankedStay] {
        stays.sorted { effectiveTotal($0.comboTotal, $0.totalPrice) < effectiveTotal($1.comboTotal, $1.totalPrice) }
    }

    static func sortByValue(_ flights: [RankedFlight]) -> [RankedFlight] {
        flights.sorted { $0.trippyValue > $1.trippyValue }
    }

    static func sortByTotal(_ flights: [RankedFlight]) -> [RankedFlight] {
        flights.sorted { effectiveTotal($0.comboTotal, $0.totalPrice) < effectiveTotal($1.comboTotal, $1.totalPrice) }
    }

    static func staySearch(_ listings: [StayListing], partySize: Int, source: String = "fixture") -> RankedStaySearch {
        let nights = listings.first?.nights ?? 1
        let ranked = listings.map { grade($0, partySize: partySize) }
        return RankedStaySearch(
            source: source,
            partySize: partySize,
            nights: nights,
            bestValue: sortByValue(ranked),
            lowestTotal: sortByTotal(ranked),
            travelHacks: sortByValue(ranked.filter { !$0.hackTags.isEmpty })
        )
    }

    static func flightSearch(_ listings: [FlightListing], partySize: Int, source: String = "fixture") -> RankedFlightSearch {
        let ranked = listings.map { grade($0, partySize: partySize) }
        return RankedFlightSearch(
            source: source,
            partySize: partySize,
            bestValue: sortByValue(ranked),
            lowestTotal: sortByTotal(ranked),
            travelHacks: sortByValue(ranked.filter { !$0.hackTags.isEmpty })
        )
    }

    private static func effectiveTotal(_ combo: Double?, _ total: Double) -> Double {
        combo ?? total
    }
}
