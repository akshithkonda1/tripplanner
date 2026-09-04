import SwiftUI

enum TrippyTheme {
    static let cream = Color(red: 0.965, green: 0.945, blue: 0.910)
    static let ink = Color(red: 0.110, green: 0.141, blue: 0.188)
    static let rust = Color(red: 0.769, green: 0.361, blue: 0.149)
    static let pine = Color(red: 0.184, green: 0.435, blue: 0.306)
    static let sky = Color(red: 0.173, green: 0.373, blue: 0.541)
    static let plum = Color(red: 0.420, green: 0.298, blue: 0.604)
    static let muted = Color(red: 0.420, green: 0.400, blue: 0.365)

    static func color(for mode: TravelMode) -> Color {
        switch mode {
        case .road: return pine
        case .flight: return sky
        case .hybrid: return plum
        }
    }
}
