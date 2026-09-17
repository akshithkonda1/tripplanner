import SwiftUI

struct CheapStaysView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var session: AuthSession
    @State private var cityOverride = ""
    @State private var partySize = 1
    @State private var search: RankedStaySearch?
    @State private var loading = false

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            let city = cityOverride.isEmpty ? workspace.trip.destination.name : cityOverride
            let checkOut = nextDay(after: workspace.trip.endDate)
            List {
                Section {
                    Text("Listings stay on this trip. Booking.com still takes payment. Trippy only reads price, stars, and guest score, then ranks value per person.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    TextField("City to search", text: $cityOverride)
                        .textInputAutocapitalization(.words)
                    Stepper("Travelers: \(partySize)", value: $partySize, in: 1...12)
                    if let search {
                        Text(search.source == "booking.com" ? "Live Booking.com inventory, ranked by Trippy." : "Sample Booking.com-shaped inventory — live when Demand API credentials are set.")
                            .font(.caption)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                }

                if loading {
                    Section { ProgressView("Ranking stays…") }
                }

                if let search {
                    Section("Best value") {
                        ForEach(search.bestValue) { stay in
                            StayResultCard(stay: stay)
                        }
                    }
                    Section("Lowest total") {
                        ForEach(search.lowestTotal) { stay in
                            StayResultCard(stay: stay)
                        }
                    }
                    Section("Travel hacks") {
                        if search.travelHacks.isEmpty {
                            Text("No extra stay hacks for this party size.")
                                .font(.footnote)
                                .foregroundStyle(TrippyTheme.muted)
                        }
                        ForEach(search.travelHacks) { stay in
                            StayResultCard(stay: stay)
                        }
                    }
                }

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
                                nights: search?.nights ?? 1
                            )
                        )
                        store.update(workspace)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .onAppear {
                if partySize == 1 {
                    partySize = max(1, workspace.trip.participants.count)
                }
                refresh(city: city, checkIn: workspace.trip.startDate, checkOut: checkOut, remote: true)
            }
            .onChange(of: cityOverride) { _ in
                refresh(city: city, checkIn: workspace.trip.startDate, checkOut: checkOut, remote: false)
            }
            .onChange(of: partySize) { _ in
                refresh(city: city, checkIn: workspace.trip.startDate, checkOut: checkOut, remote: true)
            }
        }
    }

    private func refresh(city: String, checkIn: String, checkOut: String, remote: Bool) {
        let local = BookingCatalog.localStaySearch(city: city, checkIn: checkIn, checkOut: checkOut, adults: partySize)
        search = local
        guard remote, APIConfiguration.isConfigured, let token = session.idToken else { return }
        loading = true
        Task {
            do {
                search = try await APIClient.shared.searchStays(
                    tripId: tripId,
                    city: city,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    adults: partySize,
                    idToken: token
                )
            } catch {
                search = local
            }
            loading = false
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
