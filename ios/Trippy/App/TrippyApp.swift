import SwiftUI

@main
struct TrippyApp: App {
    @StateObject private var store = TripStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}
