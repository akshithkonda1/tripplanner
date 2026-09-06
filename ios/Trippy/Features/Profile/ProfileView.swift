import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var theme: ThemeManager

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("You", systemImage: "person.crop.circle.fill")
                    Text("Shoestring traveler. Sign in with Apple lands in a later milestone.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.muted)
                }
                Section("Theme") {
                    ThemePickerView()
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    LabeledContent("Active", value: "\(theme.palette.emoji) \(theme.palette.name)")
                }
                Section("Preferences") {
                    LabeledContent("Units", value: "Miles · USD")
                    LabeledContent("Default mode", value: "Ask each time")
                }
                Section("About") {
                    LabeledContent("Apple", value: "Swift · SwiftUI")
                    LabeledContent("Android", value: "Kotlin · Compose")
                    LabeledContent("Cloud & AI", value: "AWS · Bedrock")
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Profile")
        }
    }
}
