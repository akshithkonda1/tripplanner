import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var session: AuthSession

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    LabeledContent("Signed in as", value: session.email)
                    if session.isGuest {
                        Text("Guest mode. Sign in with Cognito to sync trips to AWS.")
                            .font(.footnote)
                            .foregroundStyle(TrippyTheme.muted)
                    }
                    if session.isSignedIn || session.isGuest {
                        Button("Sign out / leave guest", role: .destructive) {
                            session.signOut()
                        }
                    }
                }
                Section("How this build works") {
                    LabeledContent("Auth", value: "Amazon Cognito")
                    LabeledContent("Cloud / AI", value: "AWS Lambda + Bedrock")
                    LabeledContent("Maps", value: "MapKit")
                    LabeledContent("Flights / fuel / stays", value: "On device — no vendor APIs")
                }
                Section("Preferences") {
                    LabeledContent("Units", value: "Miles · USD")
                    LabeledContent("Theme", value: "System")
                }
            }
            .scrollContentBackground(.hidden)
            .background(TrippyTheme.cream.ignoresSafeArea())
            .navigationTitle("Profile")
        }
    }
}
