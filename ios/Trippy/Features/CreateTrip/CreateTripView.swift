import SwiftUI

struct CreateTripView: View {
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var session: AuthSession
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var mode: TravelMode = .road
    @State private var origin = ""
    @State private var destination = ""
    @State private var originLocation: Location?
    @State private var destinationLocation: Location?
    @State private var extraCities: [String] = []
    @State private var extraCityLocations: [String: Location] = [:]
    @State private var newCity = ""
    @State private var startDate = Date().addingTimeInterval(86_400 * 21)
    @State private var endDate = Date().addingTimeInterval(86_400 * 28)
    @State private var tripType: TripType = .solo
    @State private var budgetText = ""
    @State private var datesFlexible = false
    @State private var airportQuery = ""
    @State private var isSaving = false

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
                                let resolved = airport.location
                                if origin.isEmpty {
                                    origin = resolved.name
                                    originLocation = resolved
                                } else if destination.isEmpty {
                                    destination = resolved.name
                                    destinationLocation = resolved
                                } else {
                                    extraCities.append(resolved.name)
                                    extraCityLocations[resolved.name] = resolved
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
            .disabled(isSaving)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Create") { save() }
                            .disabled(!canSave)
                            .fontWeight(.semibold)
                    }
                }
            }
        }
    }

    /// Uses the exact airport coordinates when the text still matches what was tapped;
    /// otherwise geocodes what the user typed so the map and fuel math get real coordinates.
    private func resolveLocation(text: String, cached: Location?) async -> Location {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        if let cached, cached.name == trimmed {
            return cached
        }
        if let found = await GeocodingService.locate(trimmed) {
            return found
        }
        return Location(lat: 0, lng: 0, name: trimmed)
    }

    private func save() {
        isSaving = true
        Task {
            let from = await resolveLocation(text: origin, cached: originLocation)
            let to = await resolveLocation(text: destination, cached: destinationLocation)
            let transport: TransportType = mode == .road ? .drive : .flight

            var legs = [TripLeg(id: UUID().uuidString, transport: transport, from: from, to: to)]
            var previous = to
            for city in extraCities {
                let next = await resolveLocation(text: city, cached: extraCityLocations[city])
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
            await store.create(trip, idToken: session.idToken)
            isSaving = false
            dismiss()
        }
    }
}
