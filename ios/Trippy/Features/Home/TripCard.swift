import SwiftUI

struct TripCard: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                ModeBadge(mode: trip.travelMode)
                Spacer()
                Text(trip.status.rawValue.capitalized)
                    .font(.caption)
                    .foregroundStyle(TrippyTheme.muted)
            }
            Text(trip.name)
                .font(.headline)
                .foregroundStyle(TrippyTheme.ink)
            Text(trip.routeLabel)
                .font(.subheadline)
                .foregroundStyle(TrippyTheme.muted)
            HStack {
                Label(trip.dateRangeLabel, systemImage: "calendar")
                if let budget = trip.budget {
                    Label("$\(budget)", systemImage: "dollarsign.circle")
                }
            }
            .font(.caption)
            .foregroundStyle(TrippyTheme.ink.opacity(0.75))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(TrippyTheme.color(for: trip.travelMode).opacity(0.25), lineWidth: 1)
        )
    }
}

struct ModeBadge: View {
    let mode: TravelMode

    var body: some View {
        Label(mode.title, systemImage: mode.systemImage)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .foregroundStyle(.white)
            .background(TrippyTheme.color(for: mode))
            .clipShape(Capsule())
    }
}
