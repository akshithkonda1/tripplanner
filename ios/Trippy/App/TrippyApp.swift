import SwiftUI

@main
struct TrippyApp: App {
    @StateObject private var store = TripStore()
    @StateObject private var theme = ThemeManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(theme)
                .tint(theme.palette.primary)
        }
    }
}
