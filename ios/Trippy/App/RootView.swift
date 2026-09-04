import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "suitcase.fill") }
            ExploreView()
                .tabItem { Label("Explore", systemImage: "map") }
            SamChatView(trip: nil)
                .tabItem { Label("Sam", systemImage: "sparkles") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .tint(TrippyTheme.rust)
    }
}

#Preview {
    RootView()
        .environmentObject(TripStore())
}
