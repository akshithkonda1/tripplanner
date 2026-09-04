import SwiftUI

struct PackingView: View {
    let tripId: String
    @EnvironmentObject private var store: TripStore
    @State private var extra = ""

    var body: some View {
        if let workspace = store.workspace(id: tripId) {
            List {
                Section("Packing") {
                    ForEach(workspace.packing) { item in
                        Button {
                            togglePack(item.id)
                        } label: {
                            HStack {
                                Image(systemName: item.packed ? "checkmark.circle.fill" : "circle")
                                Text(item.label).foregroundStyle(TrippyTheme.ink)
                            }
                        }
                    }
                    .onDelete { offsets in
                        var next = workspace
                        next.packing.remove(atOffsets: offsets)
                        store.update(next)
                    }
                    HStack {
                        TextField("Add an item", text: $extra)
                        Button("Add") {
                            let label = extra.trimmingCharacters(in: .whitespaces)
                            guard !label.isEmpty else { return }
                            var next = workspace
                            next.packing.append(PackingItem(id: UUID().uuidString, label: label, packed: false))
                            extra = ""
                            store.update(next)
                        }
                    }
                }

                Section("Papers (you check the official site)") {
                    ForEach(workspace.documents) { doc in
                        Button {
                            toggleDoc(doc.id)
                        } label: {
                            VStack(alignment: .leading) {
                                HStack {
                                    Image(systemName: doc.done ? "checkmark.circle.fill" : "circle")
                                    Text(doc.title).foregroundStyle(TrippyTheme.ink)
                                }
                                Text(doc.detail).font(.caption).foregroundStyle(TrippyTheme.muted)
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
        }
    }

    private func togglePack(_ id: String) {
        guard var workspace = store.workspace(id: tripId) else { return }
        if let index = workspace.packing.firstIndex(where: { $0.id == id }) {
            workspace.packing[index].packed.toggle()
            store.update(workspace)
        }
    }

    private func toggleDoc(_ id: String) {
        guard var workspace = store.workspace(id: tripId) else { return }
        if let index = workspace.documents.firstIndex(where: { $0.id == id }) {
            workspace.documents[index].done.toggle()
            store.update(workspace)
        }
    }
}
