import Foundation
import SwiftUI

@MainActor
final class AuthSession: ObservableObject {
    @Published private(set) var tokens: CognitoTokens?
    @Published var isGuest = false
    @Published var errorMessage: String?

    private let defaultsKey = "trippy.cognito.tokens"

    var isSignedIn: Bool { tokens != nil }
    var canUseApp: Bool { isSignedIn || isGuest }
    var email: String { tokens?.email ?? (isGuest ? "Guest" : "") }
    var idToken: String? { tokens?.idToken }

    init() {
        if let data = UserDefaults.standard.data(forKey: defaultsKey),
           let saved = try? JSONDecoder().decode(CognitoTokens.self, from: data) {
            tokens = saved
        }
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            let tokens = try await CognitoClient.shared.signIn(email: email, password: password)
            persist(tokens)
            isGuest = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        do {
            try await CognitoClient.shared.signUp(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func confirm(email: String, code: String) async {
        errorMessage = nil
        do {
            try await CognitoClient.shared.confirm(email: email, code: code)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func continueAsGuest() {
        isGuest = true
        errorMessage = nil
    }

    func signOut() {
        tokens = nil
        isGuest = false
        UserDefaults.standard.removeObject(forKey: defaultsKey)
    }

    private func persist(_ tokens: CognitoTokens) {
        self.tokens = tokens
        if let data = try? JSONEncoder().encode(tokens) {
            UserDefaults.standard.set(data, forKey: defaultsKey)
        }
    }
}
