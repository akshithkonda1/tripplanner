import SwiftUI

struct AuthGateView: View {
    @EnvironmentObject private var session: AuthSession
    @State private var email = ""
    @State private var password = ""
    @State private var code = ""
    @State private var mode: Mode = .signIn

    private enum Mode { case signIn, signUp, confirm }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Trippy")
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(TrippyTheme.ink)
                Text("Sign in with Amazon Cognito. Flight Mode, fuel, and stays live on this phone — AWS holds your account and, when you want it, Sam.")
                    .foregroundStyle(TrippyTheme.muted)

                if !CognitoConfig.isConfigured {
                    Text("Cognito client ID is still a placeholder. Guest mode uses the full app on SwiftData.")
                        .font(.footnote)
                        .foregroundStyle(TrippyTheme.rust)
                }

                Picker("Mode", selection: $mode) {
                    Text("Sign in").tag(Mode.signIn)
                    Text("Create account").tag(Mode.signUp)
                    Text("Confirm").tag(Mode.confirm)
                }
                .pickerStyle(.segmented)

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(12)
                    .background(Color.white.opacity(0.85))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                if mode != .confirm {
                    SecureField("Password", text: $password)
                        .textContentType(mode == .signUp ? .newPassword : .password)
                        .padding(12)
                        .background(Color.white.opacity(0.85))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    TextField("Confirmation code", text: $code)
                        .keyboardType(.numberPad)
                        .padding(12)
                        .background(Color.white.opacity(0.85))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                if let error = session.errorMessage {
                    Text(error).foregroundStyle(.red).font(.footnote)
                }

                Button(action: submit) {
                    Text(buttonTitle)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(TrippyTheme.rust)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(email.isEmpty || (mode != .confirm && password.isEmpty))

                Button("Continue as guest") {
                    session.continueAsGuest()
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 4)
            }
            .padding(24)
        }
        .background(TrippyTheme.cream.ignoresSafeArea())
    }

    private var buttonTitle: String {
        switch mode {
        case .signIn: return "Sign in"
        case .signUp: return "Create account"
        case .confirm: return "Confirm email"
        }
    }

    private func submit() {
        Task {
            switch mode {
            case .signIn:
                await session.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
            case .signUp:
                await session.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password)
                mode = .confirm
            case .confirm:
                await session.confirm(email: email.trimmingCharacters(in: .whitespaces), code: code)
                mode = .signIn
            }
        }
    }
}
