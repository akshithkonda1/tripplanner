import SwiftUI

struct FuelView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            Form {
                Section("Your vehicle (on this phone)") {
                    TextField("Name", text: Binding(
                        get: { workspace.vehicle.name },
                        set: { workspace.vehicle.name = $0; store.update(workspace) }
                    ))
                    HStack {
                        Text("MPG")
                        TextField("28", value: Binding(
                            get: { workspace.vehicle.mpg },
                            set: { workspace.vehicle.mpg = $0; store.update(workspace) }
                        ), format: .number)
                    }
                    HStack {
                        Text("Price / gal")
                        TextField("3.80", value: Binding(
                            get: { workspace.vehicle.fuelPricePerGallon },
                            set: { workspace.vehicle.fuelPricePerGallon = $0; store.update(workspace) }
                        ), format: .number)
                    }
                }

                Section("Estimate") {
                    let cost = FuelEstimator.estimate(trip: workspace.trip, vehicle: workspace.vehicle)
                    let miles = workspace.trip.legs
                        .filter { $0.transport == .drive }
                        .reduce(0.0) { $0 + FuelEstimator.miles(from: $1.from, to: $1.to) }
                    Text("About \(Int(miles == 0 ? FuelEstimator.miles(from: workspace.trip.origin, to: workspace.trip.destination) : miles)) miles")
                    Text("~$\(cost) if your numbers are right")
                        .font(.title3.weight(.semibold))
                    Text("No station-price API. This is straight-line miles × MPG × the price you typed.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                    Button("Add this estimate to the budget") {
                        workspace.expenses.append(
                            Expense(
                                id: UUID().uuidString,
                                tripId: tripId,
                                amount: cost,
                                currency: workspace.trip.homeCurrency,
                                category: .fuel,
                                paidBy: "you",
                                splitAmong: ["you"],
                                note: "On-device fuel estimate",
                                date: workspace.trip.startDate
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
