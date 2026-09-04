import SwiftUI

struct SamChatView: View {
    let tripId: String?
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var session: AuthSession
    @State private var draft = ""
    @State private var inbox: [ChatMessage] = []

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(messages) { message in
                        bubble(message)
                    }
                }
                .padding(16)
            }
            HStack(spacing: 8) {
                TextField("Ask Sam…", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                Button(action: send) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(TrippyTheme.rust)
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityLabel("Send")
            }
            .padding(12)
            .background(Color.white.opacity(0.9))
        }
        .background(TrippyTheme.cream.ignoresSafeArea())
        .navigationTitle(tripId == nil ? "Sam" : "Chat")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var messages: [ChatMessage] {
        if let tripId, let workspace = store.workspace(id: tripId) {
            if workspace.messages.isEmpty {
                return [greeting(for: workspace.trip)]
            }
            return workspace.messages
        }
        return inbox.isEmpty ? [greeting(for: nil)] : inbox
    }

    private func greeting(for trip: Trip?) -> ChatMessage {
        let text: String
        if let trip {
            switch trip.travelMode {
            case .road:
                text = "I'm Sam. Scenic miles and cheap gas math — no station API. What do you want on \(trip.name)?"
            case .flight:
                text = "I'm Sam. \(trip.name) is city stays. Log the ticket you already have; I don’t scrape fares."
            case .hybrid:
                text = "I'm Sam. Fly the long hops, drive the middle. One budget for \(trip.name)."
            }
        } else {
            text = "I'm Sam. Road, flight, or hybrid — all on this phone, Cognito for your account, Bedrock when you plug AWS in."
        }
        return ChatMessage(id: "greet", tripId: trip?.id ?? "inbox", userId: "SAM", message: text, timestamp: Date(), type: .samResponse)
    }

    private func bubble(_ message: ChatMessage) -> some View {
        let fromSam = message.userId == "SAM"
        return Text(message.message)
            .padding(12)
            .background(fromSam ? Color.white.opacity(0.85) : TrippyTheme.ink)
            .foregroundStyle(fromSam ? TrippyTheme.ink : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .frame(maxWidth: .infinity, alignment: fromSam ? .leading : .trailing)
    }

    private func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        Task {
            if let tripId, let workspace = store.workspace(id: tripId) {
                _ = await store.askSam(workspace: workspace, text: text, idToken: session.idToken)
            } else {
                if inbox.isEmpty { inbox = [greeting(for: nil)] }
                inbox.append(ChatMessage(id: UUID().uuidString, tripId: "inbox", userId: "you", message: text, timestamp: Date(), type: .user))
                inbox.append(ChatMessage(id: UUID().uuidString, tripId: "inbox", userId: "SAM", message: "Open a trip and I’ll sketch days there. I don’t call fare or hotel APIs.", timestamp: Date(), type: .samResponse))
            }
        }
    }
}
