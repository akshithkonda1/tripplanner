import SwiftUI

struct ExploreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("On the road") {
                    Label("Cheap campsites along your route", systemImage: "tent")
                    Label("Scenic pull-offs and free viewpoints", systemImage: "binoculars")
                    Label("Lowest fuel this week", systemImage: "fuelpump")
                }
                Section("Longer trips") {
                    Label("Error-fare style city hops", systemImage: "airplane")
                    Label("Hostels with weekly rates", systemImage: "bed.double")
                    Label("Night trains instead of a flight", systemImage: "tram")
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Explore")
        }
    }
}
