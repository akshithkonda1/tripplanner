import SwiftUI

// MARK: - Color hex helper

extension Color {
    /// Create a Color from a 0xRRGGBB hex value.
    init(hex: UInt) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1.0)
    }
}

// MARK: - Palette

/// A bright, swappable color palette. Trippy is an adventure, not a
/// spreadsheet — so the defaults lean into sunny yellows and oranges, and the
/// whole thing is customizable at runtime (see `ThemeManager`).
struct TrippyPalette: Identifiable, Equatable {
    let id: String
    let name: String
    let emoji: String

    let background: Color // warm, bright page background (never stark white)
    let surface: Color    // cards / raised surfaces
    let ink: Color        // primary text (deep, but never pure black)
    let muted: Color      // secondary text
    let primary: Color    // main brand color / buttons
    let accent: Color     // punchy highlights (sunshine pops)

    // Travel-mode accents
    let road: Color
    let flight: Color
    let hybrid: Color
}

extension TrippyPalette {
    /// Default: sunrise-on-the-open-road oranges and yellows.
    static let sunsetPop = TrippyPalette(
        id: "sunset-pop",
        name: "Sunset Pop",
        emoji: "🌅",
        background: Color(hex: 0xFFF3E0),
        surface: Color(hex: 0xFFFDF6),
        ink: Color(hex: 0x2A1E3F),
        muted: Color(hex: 0x8A6D5B),
        primary: Color(hex: 0xFF6A3D),
        accent: Color(hex: 0xFFC42E),
        road: Color(hex: 0x2FBF71),
        flight: Color(hex: 0x2FA4FF),
        hybrid: Color(hex: 0x9B5DE5)
    )

    /// Vacation-brochure teals, limes and coral.
    static let tropicalPunch = TrippyPalette(
        id: "tropical-punch",
        name: "Tropical Punch",
        emoji: "🌴",
        background: Color(hex: 0xEFFCF5),
        surface: Color(hex: 0xFDFFFC),
        ink: Color(hex: 0x123A34),
        muted: Color(hex: 0x5B7C74),
        primary: Color(hex: 0x00BFA6),
        accent: Color(hex: 0xFFD23F),
        road: Color(hex: 0xFF7043),
        flight: Color(hex: 0x00A5CF),
        hybrid: Color(hex: 0x8AC926)
    )

    /// Warm desert sand, rust and turquoise.
    static let desertTrail = TrippyPalette(
        id: "desert-trail",
        name: "Desert Trail",
        emoji: "🏜️",
        background: Color(hex: 0xFFF1DC),
        surface: Color(hex: 0xFFFBF3),
        ink: Color(hex: 0x3A2417),
        muted: Color(hex: 0x9C7A5B),
        primary: Color(hex: 0xE8590C),
        accent: Color(hex: 0xF6BD16),
        road: Color(hex: 0xD9480F),
        flight: Color(hex: 0x1098AD),
        hybrid: Color(hex: 0xB5179E)
    )

    /// Cool, electric berries — bright but a little more chill.
    static let berryCool = TrippyPalette(
        id: "berry-cool",
        name: "Berry Cool",
        emoji: "🫐",
        background: Color(hex: 0xF4EEFF),
        surface: Color(hex: 0xFDFBFF),
        ink: Color(hex: 0x241436),
        muted: Color(hex: 0x7A6A93),
        primary: Color(hex: 0x7B2FF7),
        accent: Color(hex: 0xFF4D8D),
        road: Color(hex: 0xF15BB5),
        flight: Color(hex: 0x00BBF9),
        hybrid: Color(hex: 0x9B5DE5)
    )

    static let all: [TrippyPalette] = [sunsetPop, tropicalPunch, desertTrail, berryCool]

    static func named(_ id: String?) -> TrippyPalette {
        all.first { $0.id == id } ?? sunsetPop
    }
}

// MARK: - Theme manager (runtime-customizable, persisted)

/// Holds the active palette and persists the traveler's choice. Inject it as an
/// `@EnvironmentObject` and change it from Profile → Theme.
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    private let storageKey = "trippy.paletteID"

    @Published var palette: TrippyPalette {
        didSet { UserDefaults.standard.set(palette.id, forKey: storageKey) }
    }

    let presets: [TrippyPalette] = TrippyPalette.all

    init() {
        let savedID = UserDefaults.standard.string(forKey: storageKey)
        palette = TrippyPalette.named(savedID)
    }

    func select(_ palette: TrippyPalette) {
        self.palette = palette
    }
}

// MARK: - TrippyTheme (backwards-compatible accessors, now palette-driven)

/// Static accessors kept for existing views. They now read from the active
/// palette, so switching themes recolors the whole app.
enum TrippyTheme {
    static var palette: TrippyPalette { ThemeManager.shared.palette }

    static var cream: Color { palette.background }
    static var surface: Color { palette.surface }
    static var ink: Color { palette.ink }
    static var muted: Color { palette.muted }
    static var rust: Color { palette.primary }
    static var accent: Color { palette.accent }
    static var pine: Color { palette.road }
    static var sky: Color { palette.flight }
    static var plum: Color { palette.hybrid }

    static func color(for mode: TravelMode) -> Color {
        switch mode {
        case .road: return palette.road
        case .flight: return palette.flight
        case .hybrid: return palette.hybrid
        }
    }
}

// MARK: - Theme picker (drop-in customization UI)

/// A fun, tappable row of palette swatches. Add it to a settings screen to let
/// travelers pick their vibe.
struct ThemePickerView: View {
    @EnvironmentObject private var theme: ThemeManager

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 14) {
                ForEach(theme.presets) { palette in
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                            theme.select(palette)
                        }
                    } label: {
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(palette.primary)
                                    .frame(width: 46, height: 46)
                                Circle()
                                    .fill(palette.accent)
                                    .frame(width: 22, height: 22)
                                    .offset(x: 12, y: 12)
                                Text(palette.emoji)
                                    .font(.system(size: 18))
                                    .offset(x: -10, y: -10)
                            }
                            .overlay(
                                Circle()
                                    .strokeBorder(
                                        theme.palette.id == palette.id ? palette.ink : .clear,
                                        lineWidth: 3
                                    )
                                    .frame(width: 54, height: 54)
                            )
                            Text(palette.name)
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(TrippyTheme.ink)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
        }
    }
}
