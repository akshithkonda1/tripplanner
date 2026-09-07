import Foundation
import SwiftData
import SwiftUI

@MainActor
final class TripStore: ObservableObject {
    @Published var workspaces: [TripWorkspace]
    @Published var filter: TravelMode?

    private var context: ModelContext?

    init(workspaces: [TripWorkspace] = SampleTrips.all.map(TripStore.makeWorkspace)) {
        self.workspaces = workspaces
    }

    func attach(context: ModelContext) {
        self.context = context
        if let loaded = loadFromDisk() {
            workspaces = loaded
        } else {
            persistAll()
        }
    }

    var visible: [TripWorkspace] {
        guard let filter else { return workspaces }
        return workspaces.filter { $0.trip.travelMode == filter }
    }

    func workspace(id: String) -> TripWorkspace? {
        workspaces.first { $0.trip.id == id }
    }

    func update(_ workspace: TripWorkspace) {
        if let index = workspaces.firstIndex(where: { $0.trip.id == workspace.trip.id }) {
            workspaces[index] = workspace
        } else {
            workspaces.insert(workspace, at: 0)
        }
        persist(workspace)
    }

    func create(_ trip: Trip, idToken: String?) async {
        var workspace = Self.makeWorkspace(trip)
        workspace.trip.itinerary = LocalPlanner.seedItinerary(for: trip)
        if APIConfiguration.isConfigured, let idToken {
            do {
                let request = CreateTripRequest(
                    tripName: trip.name,
                    travelMode: trip.travelMode,
                    origin: trip.origin,
                    destination: trip.destination,
                    legs: trip.legs,
                    startDate: trip.startDate,
                    endDate: trip.endDate,
                    datesFlexible: trip.datesFlexible,
                    tripType: trip.tripType,
                    preferences: .init(budget: trip.budget.map { NSDecimalNumber(decimal: $0).doubleValue }),
                    homeCurrency: trip.homeCurrency
                )
                workspace.trip = try await APIClient.shared.createTrip(request, idToken: idToken)
            } catch {
                // Offline / guest: keep the local workspace.
            }
        }
        update(workspace)
    }

    func refresh(idToken: String?) async {
        guard APIConfiguration.isConfigured, let idToken else { return }
        do {
            let remote = try await APIClient.shared.listTrips(idToken: idToken)
            for trip in remote {
                if workspace(id: trip.id) == nil {
                    update(Self.makeWorkspace(trip))
                }
            }
        } catch {}
    }

    func askSam(workspace: TripWorkspace, text: String, idToken: String?) async -> TripWorkspace {
        var next = workspace
        next.messages.append(
            ChatMessage(id: UUID().uuidString, tripId: workspace.trip.id, userId: "you", message: text, timestamp: Date(), type: .user)
        )
        var reply = LocalPlanner.reply(to: text, workspace: workspace)
        if APIConfiguration.isConfigured, let idToken {
            do {
                let data = try await APIClient.shared.planTrip(
                    id: workspace.trip.id,
                    message: text,
                    travelMode: workspace.trip.travelMode,
                    idToken: idToken
                )
                if let raw = String(data: data, encoding: .utf8), !raw.isEmpty {
                    reply = raw
                }
            } catch {}
        }
        next.messages.append(
            ChatMessage(id: UUID().uuidString, tripId: workspace.trip.id, userId: "SAM", message: reply, timestamp: Date(), type: .samResponse)
        )
        update(next)
        return next
    }

    nonisolated static func makeWorkspace(_ trip: Trip) -> TripWorkspace {
        TripWorkspace(
            trip: trip,
            expenses: [],
            messages: [],
            packing: LocalPlanner.defaultPacking(for: trip),
            documents: LocalPlanner.defaultDocuments(for: trip),
            flights: [],
            vehicle: VehicleProfile(name: "Daily driver", mpg: 28, fuelPricePerGallon: Decimal(string: "3.80") ?? 4),
            stayNotes: []
        )
    }

    private func persistAll() {
        workspaces.forEach(persist)
    }

    private func persist(_ workspace: TripWorkspace) {
        guard let context, let data = try? WorkspaceCodec.encoder.encode(workspace) else { return }
        let id = workspace.trip.id
        let existing = try? context.fetch(
            FetchDescriptor<WorkspaceRecord>(predicate: #Predicate { $0.tripId == id })
        ).first
        if let existing {
            existing.json = data
            existing.updatedAt = Date()
        } else {
            context.insert(WorkspaceRecord(tripId: id, json: data))
        }
        try? context.save()
    }

    private func loadFromDisk() -> [TripWorkspace]? {
        guard let context else { return nil }
        let records = (try? context.fetch(FetchDescriptor<WorkspaceRecord>())) ?? []
        let loaded = records.compactMap { try? WorkspaceCodec.decoder.decode(TripWorkspace.self, from: $0.json) }
        return loaded.isEmpty ? nil : loaded
    }
}
