import SwiftUI

struct ItineraryEditorView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @State private var newStop = ""

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ModeBadge(mode: workspace.trip.travelMode)
                    Text(workspace.trip.routeLabel).font(.title3.weight(.semibold))
                    Text(workspace.trip.dateRangeLabel).foregroundStyle(TrippyTheme.muted)
                    Text(workspace.trip.travelMode == .road
                         ? "Driving days you can rewrite."
                         : "Grouped by city stay. No fare API — add real flights on the Flights tab.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)

                    ForEach(Array(workspace.trip.itinerary.enumerated()), id: \.element.id) { index, day in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(day.city ?? day.date).font(.headline)
                            Text(day.date).font(.caption).foregroundStyle(TrippyTheme.muted)
                            ForEach(day.items) { item in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(item.name)
                                        if let notes = item.notes {
                                            Text(notes).font(.caption).foregroundStyle(TrippyTheme.muted)
                                        }
                                    }
                                    Spacer()
                                    Button(role: .destructive) {
                                        workspace.trip.itinerary[index].items.removeAll { $0.id == item.id }
                                        store.update(workspace)
                                    } label: {
                                        Image(systemName: "trash")
                                    }
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.7))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }

                    HStack {
                        TextField("Add a stop or city day", text: $newStop)
                            .textFieldStyle(.roundedBorder)
                        Button("Add") {
                            let label = newStop.trimmingCharacters(in: .whitespaces)
                            guard !label.isEmpty else { return }
                            if workspace.trip.itinerary.isEmpty {
                                workspace.trip.itinerary = LocalPlanner.seedItinerary(for: workspace.trip)
                            }
                            let item = ItineraryItem(
                                id: UUID().uuidString,
                                type: workspace.trip.travelMode == .road ? .activity : .activity,
                                name: label,
                                location: workspace.trip.destination,
                                durationMinutes: 60,
                                notes: "Added on device",
                                isBooked: false
                            )
                            if workspace.trip.itinerary.isEmpty {
                                workspace.trip.itinerary = [
                                    DayPlan(id: UUID().uuidString, date: workspace.trip.startDate, city: workspace.trip.origin.name, items: [item])
                                ]
                            } else {
                                workspace.trip.itinerary[workspace.trip.itinerary.count - 1].items.append(item)
                            }
                            store.update(workspace)
                            newStop = ""
                        }
                    }

                    Button("Ask Sam to sketch days") {
                        workspace.trip.itinerary = LocalPlanner.seedItinerary(for: workspace.trip)
                        store.update(workspace)
                    }
                    .buttonStyle(.bordered)
                }
                .padding(20)
            }
            .background(TrippyTheme.cream.ignoresSafeArea())
        }
    }
}
