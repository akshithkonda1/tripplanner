import SwiftUI

struct SamChatView: View {
    let trip: Trip?
    @State private var draft = ""
    @State private var messages: [ChatMessage]

    init(trip: Trip?) {
        self.trip = trip
        let greeting: String
        if let trip {
            switch trip.travelMode {
            case .road:
                greeting = "I'm Sam. Want scenic miles, cheap gas, or a looser pace on \(trip.name)?"
            case .flight:
                greeting = "I'm Sam. \(trip.name) is a longer trip — I can sketch city stays and hunt cheaper fares."
            case .hybrid:
                greeting = "I'm Sam. Fly, drive, fly — I'll treat each leg of \(trip.name) by how you actually move."
            }
        } else {
            greeting = "I'm Sam, your trip co-pilot. Road, flight, or hybrid — tell me where you want to go."
        }
        _messages = State(initialValue: [
            ChatMessage(
                id: UUID().uuidString,
                tripId: trip?.id ?? "inbox",
                userId: "SAM",
                message: greeting,
                timestamp: Date(),
                type: .samResponse
            )
        ])
    }

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
        .navigationTitle(trip == nil ? "Sam" : "Chat")
        .navigationBarTitleDisplayMode(.inline)
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
        messages.append(
            ChatMessage(
                id: UUID().uuidString,
                tripId: trip?.id ?? "inbox",
                userId: "you",
                message: text,
                timestamp: Date(),
                type: .user
            )
        )
        draft = ""
        messages.append(
            ChatMessage(
                id: UUID().uuidString,
                tripId: trip?.id ?? "inbox",
                userId: "SAM",
                message: reply(to: text),
                timestamp: Date(),
                type: .samResponse
            )
        )
    }

    private func reply(to text: String) -> String {
        let mode = trip?.travelMode ?? .road
        switch mode {
        case .flight:
            return "Got it — “\(text)”. When Bedrock is wired I’ll search fares cheapest-first and group days by city stay."
        case .hybrid:
            return "Got it — “\(text)”. I’ll keep air legs and drive legs on the same itinerary so the budget stays one number."
        case .road:
            return "Got it — “\(text)”. When Bedrock is wired I’ll sketch driving days, cheap fuel, and places to sleep."
        }
    }
}
