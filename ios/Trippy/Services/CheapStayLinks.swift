import Foundation

enum CheapStayTier: String {
    case free, cheap, mostUsage
}

struct CheapStayLink: Identifiable {
    var id: String
    var title: String
    var subtitle: String
    var tier: CheapStayTier
    var url: URL
}

enum CheapStayLinks {
    /// Free first, then hostels, then Booking.com (most usage) cheapest-first.
    static func ranked(place: String, checkIn: String, checkOut: String) -> [CheapStayLink] {
        let q = place.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? place
        func url(_ string: String) -> URL {
            URL(string: string) ?? URL(string: "https://www.booking.com")!
        }

        return [
            CheapStayLink(
                id: "freecamp",
                title: "Free / cheap campsites",
                subtitle: "As close to free as it gets",
                tier: .free,
                url: url("https://freecampsites.net/#q=\(q)")
            ),
            CheapStayLink(
                id: "recreation",
                title: "Public land & campgrounds",
                subtitle: "Recreation.gov — often cheaper than a motel",
                tier: .free,
                url: url("https://www.recreation.gov/search?q=\(q)")
            ),
            CheapStayLink(
                id: "couchsurfing",
                title: "Couchsurfing",
                subtitle: "Free stay with a host when it works out",
                tier: .free,
                url: url("https://www.couchsurfing.com/?q=\(q)")
            ),
            CheapStayLink(
                id: "hostelworld",
                title: "Hostelworld",
                subtitle: "Dorm beds — usually the cheapest roof in town",
                tier: .cheap,
                url: url("https://www.hostelworld.com/search?search_keywords=\(q)&date_from=\(checkIn)&date_to=\(checkOut)&number_of_guests=1")
            ),
            CheapStayLink(
                id: "booking-hostels",
                title: "Booking.com hostels",
                subtitle: "Same site everyone uses, hostel filter, price order",
                tier: .cheap,
                url: url("https://www.booking.com/searchresults.html?ss=\(q)&checkin=\(checkIn)&checkout=\(checkOut)&order=price&nflt=ht_id%3D204")
            ),
            CheapStayLink(
                id: "booking-cheap",
                title: "Booking.com — cheapest first",
                subtitle: "Most usage, most beds. Sorted by price, not stars",
                tier: .mostUsage,
                url: url("https://www.booking.com/searchresults.html?ss=\(q)&checkin=\(checkIn)&checkout=\(checkOut)&group_adults=1&no_rooms=1&order=price")
            ),
            CheapStayLink(
                id: "airbnb",
                title: "Airbnb",
                subtitle: "Sometimes a whole place beats two hotel rooms",
                tier: .mostUsage,
                url: url("https://www.airbnb.com/s/\(q)/homes?checkin=\(checkIn)&checkout=\(checkOut)")
            ),
            CheapStayLink(
                id: "hotels",
                title: "Hotels.com",
                subtitle: "Extra inventory if Booking.com is thin",
                tier: .mostUsage,
                url: url("https://www.hotels.com/Hotel-Search?destination=\(q)&startDate=\(checkIn)&endDate=\(checkOut)")
            )
        ]
    }
}
