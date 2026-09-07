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
                    Text("Stays: free camps first, then Hostelworld, then Booking.com sorted by price (most beds).")
                    Text("Sam will pace city stays if you ask.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Explore")
        }
    }
}
