import SwiftData
import SwiftUI

@main
struct TrippyApp: App {
    @StateObject private var session = AuthSession()
    @StateObject private var store = TripStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(store)
                .onAppear {
                    // Model container is attached from RootView via environment.
                }
        }
        .modelContainer(for: WorkspaceRecord.self)
    }
}
