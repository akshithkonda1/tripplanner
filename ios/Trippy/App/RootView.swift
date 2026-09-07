import SwiftData
import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var store: TripStore
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        Group {
            if session.canUseApp {
                MainTabs()
            } else {
                AuthGateView()
            }
        }
        .onAppear {
            store.attach(context: modelContext)
        }
    }
}

struct MainTabs: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "suitcase.fill") }
            ExploreView()
                .tabItem { Label("Explore", systemImage: "map") }
            SamChatView(tripId: nil)
                .tabItem { Label("Sam", systemImage: "sparkles") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .tint(TrippyTheme.rust)
    }
}
