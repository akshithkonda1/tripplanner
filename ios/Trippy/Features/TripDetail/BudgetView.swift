import SwiftUI

struct BudgetView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @State private var amount = ""
    @State private var note = ""
    @State private var category: ExpenseCategory = .food

    var body: some View {
        if var workspace = store.workspace(id: tripId) {
            let spent = workspace.expenses.reduce(Decimal.zero) { $0 + $1.amount }
            List {
                Section {
                    if let cap = workspace.trip.budget {
                        Text("$\(spent) of $\(cap) \(workspace.trip.homeCurrency)")
                            .font(.title2.weight(.bold))
                        ProgressView(value: NSDecimalNumber(decimal: spent).doubleValue, total: max(NSDecimalNumber(decimal: cap).doubleValue, 1))
                    } else {
                        Text("Spent $\(spent). Set a cap anytime — this app is built for shoestring trips.")
                    }
                }

                Section("Log an expense") {
                    Picker("Category", selection: $category) {
                        ForEach(ExpenseCategory.allCases, id: \.self) { item in
                            Text(item.title).tag(item)
                        }
                    }
                    TextField("Amount", text: $amount).keyboardType(.decimalPad)
                    TextField("Note", text: $note)
                    Button("Add") {
                        guard let value = Decimal(string: amount) else { return }
                        workspace.expenses.append(
                            Expense(
                                id: UUID().uuidString,
                                tripId: tripId,
                                amount: value,
                                currency: workspace.trip.homeCurrency,
                                category: category,
                                paidBy: "you",
                                splitAmong: workspace.trip.participants.map(\.id),
                                note: note,
                                date: DateFormatters.iso.string(from: Date())
                            )
                        )
                        store.update(workspace)
                        amount = ""; note = ""
                    }
                }

                Section("Ledger") {
                    ForEach(workspace.expenses) { expense in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(expense.category.title)
                                Text(expense.note).font(.caption).foregroundStyle(TrippyTheme.muted)
                            }
                            Spacer()
                            Text("$\(expense.amount)")
                        }
                    }
                    .onDelete { index in
                        workspace.expenses.remove(atOffsets: index)
                        store.update(workspace)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
        }
    }
}
