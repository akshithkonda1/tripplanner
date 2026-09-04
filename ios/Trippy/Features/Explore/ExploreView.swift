import SwiftUI

struct ExploreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("On the road (ideas, not a feed)") {
                    Text("Look for city / county campgrounds — they’re often cheaper than apps that take a cut.")
                    Text("Fill up when you see a price you like. We don’t pull live gas APIs.")
                    Text("Download the offline MapKit area before you lose signal.")
                }
                Section("Longer trips") {
                    Text("Use the bundled airport list, then buy the ticket on the airline site you trust.")
                    Text("Hostels and night trains: search yourself, then log the confirmation on the trip.")
                    Text("Sam will pace city stays if you ask — still no fare API.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Explore")
        }
    }
}
