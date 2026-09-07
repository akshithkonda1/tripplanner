import SwiftUI

/// Booking.com-first flight hunt, then the other search sites, cheapest-first.
/// Same live-results idea as Stays: we open the ranked search, not a paid API.
struct FlightsView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @State private var originOverride = ""
    @State private var destOverride = ""
    @State private var showingHackExplain = false
    @State private var airline = ""
    @State private var number = ""
    @State private var pnr = ""
    @State private var from = ""
    @State private var to = ""
    @State private var date = Date()
    @State private var cost = ""

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            let hunts = flightHunts(for: workspace.trip)
            List {
                Section {
                    Text("Same idea as stays: Booking.com first (sort by cheapest), then Kayak, Google Flights, Skyscanner, and Momondo. Nearby airports, midweek, ±3 days, one-ways, and open-jaw.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    TextField("From (city or IATA)", text: $originOverride)
                        .textInputAutocapitalization(.characters)
                    TextField("To (city or IATA)", text: $destOverride)
                        .textInputAutocapitalization(.characters)
                    if workspace.trip.datesFlexible {
                        Text("Flexible dates are on — the ±3 day and midweek rows are the ones to tap first.")
                            .font(.caption)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                } header: {
                    Label("Hunt the cheapest", systemImage: "airplane")
                }

                if hunts.allSatisfy(\.hacks.isEmpty) {
                    Section {
                        Text("Add a start, destination, and dates we can turn into airport codes (SFO, Lisbon, Tokyo…).")
                            .font(.footnote)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                }

                ForEach(hunts) { hunt in
                    Section {
                        ForEach(hunt.hacks) { hack in
                            Link(destination: hack.url) {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(hack.provider)
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(hack.isBooking ? TrippyTheme.sky : TrippyTheme.muted)
                                        Spacer()
                                        if hack.isBooking {
                                            Text("1st")
                                                .font(.caption2.weight(.bold))
                                                .foregroundStyle(TrippyTheme.sky)
                                        }
                                    }
                                    Text(hack.title)
                                        .font(.headline)
                                    Text(hack.why)
                                        .font(.caption)
                                        .foregroundStyle(TrippyTheme.muted)
                                }
                            }
                        }
                    } header: {
                        Label(hunt.label, systemImage: "arrow.up.arrow.down")
                    } footer: {
                        Text(hunt.subtitle)
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
        }
    }

    private func flightHunts(for trip: Trip) -> [FlightHunt] {
        if !originOverride.isEmpty || !destOverride.isEmpty {
            let origin = originOverride.isEmpty ? trip.origin.name : originOverride
            let dest = destOverride.isEmpty ? trip.destination.name : destOverride
            let start = DateFormatters.iso.date(from: trip.startDate) ?? Date()
            let end = DateFormatters.iso.date(from: trip.endDate) ?? start
            return [
                FlightHunt(
                    id: "override",
                    label: "Cheapest searches first",
                    subtitle: "Booking.com cheapest, then the other sites.",
                    hacks: TravelHacking.searches(
                        originQuery: origin,
                        destinationQuery: dest,
                        depart: start,
                        returnDate: end
                    )
                )
            ]
        }
        return TravelHacking.hunts(for: trip)
    }
}

struct TravelHackExplainSheet: View {
    var body: some View {
        List {
            Section("What we try") {
                Text("Nearby airports within ~90 miles (SFO ↔ OAK, JFK ↔ EWR).")
                Text("Shift dates ±3 days, and always try a Tuesday or Wednesday.")
                Text("One-ways both directions, in case two cheap singles beat a round-trip.")
                Text("Open-jaw: fly into one airport, home from another in the same city.")
                Text("Booking.com cheapest sort first — most people already use it for stays.")
            }
            Section("What we never do") {
                Text("Hidden-city / skiplagging. Airlines cancel the rest of the ticket and it can get you banned.")
                Text("Scraping Booking.com or any other site. You see their live results in Safari.")
            }
        }
        .navigationTitle("Travel hacking")
        .navigationBarTitleDisplayMode(.inline)
    }
}
