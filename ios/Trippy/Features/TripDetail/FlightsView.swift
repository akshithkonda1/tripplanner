import SwiftUI

/// In-trip flight results. Booking.com still takes payment; Trippy ranks value and travel hacks.
struct FlightsView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var session: AuthSession
    @State private var originOverride = ""
    @State private var destOverride = ""
    @State private var partySize = 1
    @State private var showingHackExplain = false
    @State private var search: RankedFlightSearch?
    @State private var loading = false
    @State private var airline = ""
    @State private var number = ""
    @State private var pnr = ""
    @State private var from = ""
    @State private var to = ""
    @State private var date = Date()
    @State private var cost = ""

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            List {
                Section {
                    Text("Results stay on this trip. Trippy reads each fare (price, stops, party size) and ranks value per person. Payment is still Booking.com.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    TextField("From (city or IATA)", text: $originOverride)
                        .textInputAutocapitalization(.characters)
                    TextField("To (city or IATA)", text: $destOverride)
                        .textInputAutocapitalization(.characters)
                    Stepper("Travelers: \(partySize)", value: $partySize, in: 1...12)
                    if workspace.trip.datesFlexible {
                        Text("Flexible dates are on — check the ±3 day and midweek rows first.")
                            .font(.caption)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                } header: {
                    Label("Hunt the cheapest", systemImage: "airplane")
                }

                if loading {
                    Section { ProgressView("Ranking fares…") }
                }

                if let search {
                    Section("Best value") {
                        ForEach(search.bestValue) { flight in
                            FlightResultCard(flight: flight)
                        }
                    }
                    Section("Lowest total") {
                        ForEach(search.lowestTotal) { flight in
                            FlightResultCard(flight: flight)
                        }
                    }
                    Section("Travel hacks") {
                        ForEach(search.travelHacks) { flight in
                            FlightResultCard(flight: flight)
                        }
                    }
                } else if !loading {
                    Section {
                        Text("Add a start, destination, and dates we can turn into airport codes (SFO, Lisbon, Tokyo…).")
                            .font(.footnote)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                }

                Button {
                    showingHackExplain = true
                } label: {
                    Label("How the travel hack works", systemImage: "info.circle")
                }

                Section {
                    if workspace.flights.isEmpty {
                        Text("Log a ticket you already bought so the budget stays honest.")
                            .font(.footnote)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                    ForEach(workspace.flights) { flight in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(flight.airline) \(flight.flightNumber)")
                                .font(.headline)
                            Text("\(flight.fromCode) → \(flight.toCode)")
                            if !flight.confirmationCode.isEmpty {
                                Text("PNR \(flight.confirmationCode)").font(.caption)
                            }
                            if let cost = flight.cost {
                                Text("$\(cost)").font(.caption.weight(.semibold))
                            }
                        }
                    }
                    .onDelete { index in
                        workspace.flights.remove(atOffsets: index)
                        store.update(workspace)
                    }
                } header: {
                    Label("Already booked", systemImage: "ticket")
                }

                Section("Add a flight you hold") {
                    TextField("Airline", text: $airline)
                    TextField("Flight number (e.g. UA 128)", text: $number)
                    TextField("Confirmation / PNR", text: $pnr)
                    TextField("From IATA or city", text: $from)
                    TextField("To IATA or city", text: $to)
                    DatePicker("Depart", selection: $date, displayedComponents: .date)
                    TextField("What you paid (optional)", text: $cost)
                        .keyboardType(.decimalPad)
                    Button("Save flight") {
                        let flight = ManualFlight(
                            id: UUID().uuidString,
                            airline: airline,
                            flightNumber: number,
                            confirmationCode: pnr,
                            fromCode: from,
                            fromCity: from,
                            toCode: to,
                            toCity: to,
                            departDate: DateFormatters.iso.string(from: date),
                            departTime: "",
                            arriveDate: DateFormatters.iso.string(from: date),
                            arriveTime: "",
                            cabin: "economy",
                            bags: "",
                            cost: Decimal(string: cost)
                        )
                        workspace.flights.append(flight)
                        if let amount = flight.cost {
                            workspace.expenses.append(
                                Expense(
                                    id: UUID().uuidString,
                                    tripId: tripId,
                                    amount: amount,
                                    currency: workspace.trip.homeCurrency,
                                    category: .flights,
                                    paidBy: "you",
                                    splitAmong: ["you"],
                                    note: "\(airline) \(number)",
                                    date: flight.departDate
                                )
                            )
                        }
                        store.update(workspace)
                        airline = ""; number = ""; pnr = ""; from = ""; to = ""; cost = ""
                    }
                    .disabled(airline.isEmpty || number.isEmpty || from.isEmpty || to.isEmpty)
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .sheet(isPresented: $showingHackExplain) {
                NavigationStack {
                    TravelHackExplainSheet()
                        .toolbar {
                            ToolbarItem(placement: .confirmationAction) {
                                Button("Done") { showingHackExplain = false }
                            }
                        }
                }
            }
            .onAppear {
                if partySize == 1 {
                    partySize = max(1, workspace.trip.participants.count)
                }
                refresh(trip: workspace.trip, remote: true)
            }
            .onChange(of: originOverride) { _ in refresh(trip: workspace.trip, remote: false) }
            .onChange(of: destOverride) { _ in refresh(trip: workspace.trip, remote: false) }
            .onChange(of: partySize) { _ in refresh(trip: workspace.trip, remote: true) }
        }
    }

    private func refresh(trip: Trip, remote: Bool) {
        let origin = originOverride.isEmpty ? trip.origin.name : originOverride
        let dest = destOverride.isEmpty ? trip.destination.name : destOverride
        let local = BookingCatalog.localFlightSearch(
            from: origin,
            to: dest,
            depart: trip.startDate,
            returnDate: trip.endDate,
            adults: partySize
        )
        search = local.bestValue.isEmpty ? nil : local
        guard remote, APIConfiguration.isConfigured, let token = session.idToken, search != nil else { return }
        loading = true
        Task {
            do {
                search = try await APIClient.shared.searchFlights(
                    tripId: tripId,
                    from: origin,
                    to: dest,
                    depart: trip.startDate,
                    returnDate: trip.endDate,
                    adults: partySize,
                    idToken: token
                )
            } catch {
                search = local.bestValue.isEmpty ? nil : local
            }
            loading = false
        }
    }
}

struct TravelHackExplainSheet: View {
    var body: some View {
        List {
            Section("What Trippy ranks") {
                Text("Nearby airports within ~90 miles (SFO ↔ OAK, JFK ↔ EWR).")
                Text("Shift dates ±3 days, and always try a Tuesday or Wednesday.")
                Text("One-ways both directions, in case two cheap singles beat a round-trip.")
                Text("Open-jaw: fly into one airport, home from another in the same city.")
                Text("Hidden-city / skiplag when a through fare via your city is cheaper — tagged with a hard warning.")
                Text("Value per person: a $1,000 / 3-night 5-star for four people beats a 3-star at the same price.")
            }
            Section("What we never do") {
                Text("Scraping Booking.com. Inventory is structured listings (Demand API or a Booking.com-shaped catalog). Payment stays on Booking.com.")
                Text("Hiding the risk on a hidden-city fare. Bags, the rest of the ticket, and the airline contract of carriage are on you.")
            }
        }
        .navigationTitle("Travel hacking")
        .navigationBarTitleDisplayMode(.inline)
    }
}
