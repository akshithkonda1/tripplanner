import Foundation

struct CognitoConfig {
    static var region = ProcessInfo.processInfo.environment["COGNITO_REGION"] ?? "us-east-1"
    static var clientId = ProcessInfo.processInfo.environment["COGNITO_CLIENT_ID"] ?? "YOUR_COGNITO_CLIENT_ID"

    static var isConfigured: Bool {
        !clientId.contains("YOUR_COGNITO")
    }

    static var endpoint: URL {
        URL(string: "https://cognito-idp.\(region).amazonaws.com/")!
    }
}

struct CognitoTokens: Codable, Equatable {
    var idToken: String
    var accessToken: String
    var refreshToken: String
    var email: String
}

enum CognitoError: LocalizedError {
    case notConfigured
    case message(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Cognito is not configured yet. You can keep using guest mode."
        case .message(let text): return text
        }
    }
}

/// Talks to Cognito over the public JSON API. No Amplify, no extra travel vendors.
actor CognitoClient {
    static let shared = CognitoClient()

    func signUp(email: String, password: String) async throws {
        try await call(target: "AWSCognitoIdentityProviderService.SignUp", body: [
            "ClientId": CognitoConfig.clientId,
            "Username": email,
            "Password": password,
            "UserAttributes": [["Name": "email", "Value": email]]
        ])
    }

    func confirm(email: String, code: String) async throws {
        try await call(target: "AWSCognitoIdentityProviderService.ConfirmSignUp", body: [
            "ClientId": CognitoConfig.clientId,
            "Username": email,
            "ConfirmationCode": code
        ])
    }

    func signIn(email: String, password: String) async throws -> CognitoTokens {
        let json = try await call(target: "AWSCognitoIdentityProviderService.InitiateAuth", body: [
            "AuthFlow": "USER_PASSWORD_AUTH",
            "ClientId": CognitoConfig.clientId,
            "AuthParameters": [
                "USERNAME": email,
                "PASSWORD": password
            ]
        ])
        guard
            let result = json["AuthenticationResult"] as? [String: Any],
            let idToken = result["IdToken"] as? String,
            let access = result["AccessToken"] as? String,
            let refresh = result["RefreshToken"] as? String
        else {
            throw CognitoError.message("Cognito did not return tokens. Confirm the account first.")
        }
        return CognitoTokens(idToken: idToken, accessToken: access, refreshToken: refresh, email: email)
    }

    @discardableResult
    private func call(target: String, body: [String: Any]) async throws -> [String: Any] {
        guard CognitoConfig.isConfigured else { throw CognitoError.notConfigured }
        var request = URLRequest(url: CognitoConfig.endpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-amz-json-1.1", forHTTPHeaderField: "Content-Type")
        request.setValue(target, forHTTPHeaderField: "X-Amz-Target")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let message = (json["message"] as? String) ?? (json["__type"] as? String) ?? "Cognito request failed"
            throw CognitoError.message(message)
        }
        return json
    }
}
