import SwiftUI

struct CreateTripView: View {
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var session: AuthSession
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var mode: TravelMode = .road
    @State private var origin = ""
    @State private var destination = ""
    @State private var extraCities: [String] = []
    @State private var newCity = ""
    @State private var startDate = Date().addingTimeInterval(86_400 * 21)
    @State private var endDate = Date().addingTimeInterval(86_400 * 28)
    @State private var tripType: TripType = .solo
    @State private var budgetText = ""
    @State private var datesFlexible = false
    @State private var airportQuery = ""

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && !origin.trimmingCharacters(in: .whitespaces).isEmpty
            && !destination.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("How are you traveling?") {
                    Picker("Mode", selection: $mode) {
                        ForEach(TravelMode.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)

                    Text(mode.subtitle)
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    if mode != .road {
                        Text("No fare API — you’ll type the real flight later. Airports below are a bundled list on the phone.")
                            .font(.footnote)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                }

                Section("The trip") {
                    TextField("Trip name", text: $name)
                    TextField(mode == .road ? "From" : "From (city or IATA)", text: $origin)
                    TextField(mode == .road ? "To" : "To (city or IATA)", text: $destination)
                }

                if mode != .road {
                    Section("Bundled airports") {
                        TextField("Search SFO, Lisbon, Narita…", text: $airportQuery)
                        ForEach(AirportDirectory.search(airportQuery).prefix(8)) { airport in
                            Button {
                                if origin.isEmpty {
                                    origin = "\(airport.iata) \(airport.city)"
                                } else if destination.isEmpty {
                                    destination = "\(airport.iata) \(airport.city)"
                                } else {
                                    extraCities.append("\(airport.iata) \(airport.city)")
                                }
                            } label: {
                                VStack(alignment: .leading) {
                                    Text("\(airport.iata) · \(airport.city)")
                                    Text(airport.name).font(.caption).foregroundStyle(TrippyTheme.muted)
                                }
                            }
                        }
                    }

                    Section("More cities") {
                        ForEach(extraCities, id: \.self) { city in
                            Text(city)
                        }
                        .onDelete { extraCities.remove(atOffsets: $0) }

                        HStack {
                            TextField("Add a city", text: $newCity)
                            Button("Add") {
                                let trimmed = newCity.trimmingCharacters(in: .whitespaces)
                                guard !trimmed.isEmpty else { return }
                                extraCities.append(trimmed)
                                newCity = ""
                            }
                        }
                        Toggle("Flexible dates (±3 days) for your own search", isOn: $datesFlexible)
                    }
                }

                Section("When") {
                    DatePicker("Start", selection: $startDate, displayedComponents: .date)
                    DatePicker("End", selection: $endDate, in: startDate..., displayedComponents: .date)
                }

                Section("Who & budget") {
                    Picker("Traveling as", selection: $tripType) {
                        ForEach(TripType.allCases) { type in
                            Text(type.rawValue.capitalized).tag(type)
                        }
                    }
                    TextField("Budget (optional)", text: $budgetText)
                        .keyboardType(.decimalPad)
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("New trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { save() }
                        .disabled(!canSave)
                        .fontWeight(.semibold)
                }
            }
        }
    }

    private func save() {
        let from = Location(lat: 0, lng: 0, name: origin.trimmingCharacters(in: .whitespaces))
        let to = Location(lat: 0, lng: 0, name: destination.trimmingCharacters(in: .whitespaces))
        let transport: TransportType = mode == .road ? .drive : .flight

        var legs = [TripLeg(id: UUID().uuidString, transport: transport, from: from, to: to)]
        var previous = to
        for city in extraCities {
            let next = Location(lat: 0, lng: 0, name: city)
            legs.append(
                TripLeg(
                    id: UUID().uuidString,
                    transport: mode == .hybrid ? .drive : .flight,
                    from: previous,
                    to: next
                )
            )
            previous = next
        }

        let trip = Trip(
            id: UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            travelMode: mode,
            origin: from,
            destination: extraCities.isEmpty ? to : previous,
            legs: legs,
            startDate: DateFormatters.iso.string(from: startDate),
            endDate: DateFormatters.iso.string(from: endDate),
            datesFlexible: datesFlexible && mode != .road,
            tripType: tripType,
            budget: Decimal(string: budgetText),
            status: .planning,
            participants: [Participant(id: "you", name: session.email)]
        )
        Task {
            await store.create(trip, idToken: session.idToken)
            dismiss()
        }
    }
}
