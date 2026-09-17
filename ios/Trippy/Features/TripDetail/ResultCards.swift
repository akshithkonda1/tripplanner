import SwiftUI

struct HackChips: View {
    let tags: [HackTag]

    var body: some View {
        if !tags.isEmpty {
            FlowChips(tags: tags)
        }
    }
}

private struct FlowChips: View {
    let tags: [HackTag]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(tags, id: \.self) { tag in
                Text(tag.title)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(tag == .hiddenCity ? TrippyTheme.rust.opacity(0.15) : TrippyTheme.sky.opacity(0.12))
                    .foregroundStyle(tag == .hiddenCity ? TrippyTheme.rust : TrippyTheme.sky)
                    .clipShape(Capsule())
            }
        }
    }
}

struct StayResultCard: View {
    let stay: RankedStay

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(stay.name)
                    .font(.headline)
                Spacer()
                Text(String(format: "Trippy %.0f", stay.trippyValue * 1000))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(TrippyTheme.sky)
            }
            Text("\(stay.stars, specifier: "%g")★ · Booking.com \(stay.guestRating, specifier: "%.1f")/10 · \(stay.propertyType)")
                .font(.caption)
                .foregroundStyle(TrippyTheme.muted)
            Text(String(format: "$%.0f total · $%.0f/night · $%.0f/person/night", stay.totalPrice, stay.nightly, stay.perPersonNight))
                .font(.subheadline.weight(.semibold))
            HackChips(tags: stay.hackTags)
            if let warning = stay.warning, !warning.isEmpty {
                Text(warning)
                    .font(.caption2)
                    .foregroundStyle(TrippyTheme.rust)
            }
            Link("Book on Booking.com", destination: stay.bookURL)
                .font(.subheadline.weight(.semibold))
        }
        .padding(.vertical, 4)
    }
}

struct FlightResultCard: View {
    let flight: RankedFlight

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(flight.routeLabel)
                    .font(.headline)
                Spacer()
                Text(String(format: "Trippy %.0f", flight.trippyValue * 1000))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(TrippyTheme.sky)
            }
            Text("\(flight.departDate)\(flight.returnDate.map { " – \($0)" } ?? " · one-way") · \(flight.stops == 0 ? "nonstop" : "\(flight.stops) stop")")
                .font(.caption)
                .foregroundStyle(TrippyTheme.muted)
            Text(String(format: "$%.0f total · $%.0f/person", flight.comboTotal ?? flight.totalPrice, flight.perPerson))
                .font(.subheadline.weight(.semibold))
            HackChips(tags: flight.hackTags)
            if let warning = flight.warning, !warning.isEmpty {
                Text(warning)
                    .font(.caption2)
                    .foregroundStyle(TrippyTheme.rust)
            }
            Link("Book on Booking.com", destination: flight.bookURL)
                .font(.subheadline.weight(.semibold))
        }
        .padding(.vertical, 4)
    }
}
