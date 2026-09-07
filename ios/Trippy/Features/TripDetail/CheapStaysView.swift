import SwiftUI

struct CheapStaysView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @State private var cityOverride = ""

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            let city = cityOverride.isEmpty ? workspace.trip.destination.name : cityOverride
            let checkOut = nextDay(after: workspace.trip.endDate)
            let links = CheapStayLinks.ranked(
                place: city,
                checkIn: workspace.trip.startDate,
                checkOut: checkOut
            )

            List {
                Section {
                    Text("Free first, then hostels, then Booking.com sorted by price. Booking.com is here because it has the most beds — we still open it cheapest-first.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    TextField("City to search", text: $cityOverride)
                        .textInputAutocapitalization(.words)
                }

                section(title: "Free or nearly free", links: links.filter { $0.tier == .free })
                section(title: "Cheap beds", links: links.filter { $0.tier == .cheap })
                section(title: "Most usage (cheapest sort)", links: links.filter { $0.tier == .mostUsage })

                Section("After you book") {
                    ForEach(workspace.stayNotes) { stay in
                        Text("\(stay.place) · \(stay.city)")
                    }
                    Button("I booked something — save a note") {
                        workspace.stayNotes.append(
                            StayNote(
                                id: UUID().uuidString,
                                city: city,
                                place: "Booked via Booking.com / hostel",
                                confirmation: "",
                                nights: 1
                            )
                        )
                        store.update(workspace)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
        }
    }

    private func section(title: String, links: [CheapStayLink]) -> some View {
        Section(title) {
            ForEach(links) { link in
                Link(destination: link.url) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(link.title).font(.headline)
                        Text(link.subtitle).font(.caption).foregroundStyle(TrippyTheme.muted)
                    }
                }
            }
        }
    }

    private func nextDay(after iso: String) -> String {
        guard let date = DateFormatters.iso.date(from: iso),
              let next = Calendar.current.date(byAdding: .day, value: 1, to: date) else {
            return iso
        }
        return DateFormatters.iso.string(from: next)
    }
}
