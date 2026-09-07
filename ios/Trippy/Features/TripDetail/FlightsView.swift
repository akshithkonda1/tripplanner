import SwiftUI

struct FlightsView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
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
                    Text("Log the ticket you already bought. Trippy does not search or book flights.")
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

                Section("Stays you booked yourself") {
                    ForEach(workspace.stayNotes) { stay in
                        Text("\(stay.place) · \(stay.city) · \(stay.nights) nights")
                    }
                    Button("Add a hostel / stay note") {
                        workspace.stayNotes.append(
                            StayNote(
                                id: UUID().uuidString,
                                city: workspace.trip.destination.name,
                                place: "Hostel / friend / camp",
                                confirmation: "",
                                nights: 2
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
}
