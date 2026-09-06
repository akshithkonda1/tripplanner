package com.trippy.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color
import com.trippy.domain.TravelMode

// Trippy is an adventure, not a spreadsheet — the palette leans into bright,
// sunny oranges and yellows. Defaults below are the "Sunset Pop" preset; swap
// presets via TrippyTheme(preset = ...).

// Legacy top-level accessors (referenced across the UI). Default = Sunset Pop.
val Cream = Color(0xFFFFF3E0)
val Ink = Color(0xFF2A1E3F)
val Rust = Color(0xFFFF6A3D)
val Pine = Color(0xFF2FBF71)
val Sky = Color(0xFF2FA4FF)
val Plum = Color(0xFF9B5DE5)
val Muted = Color(0xFF8A6D5B)
val Accent = Color(0xFFFFC42E)

/** A bright, swappable palette. */
data class TrippyPalette(
    val id: String,
    val displayName: String,
    val emoji: String,
    val background: Color,
    val surface: Color,
    val ink: Color,
    val muted: Color,
    val primary: Color,
    val accent: Color,
    val road: Color,
    val flight: Color,
    val hybrid: Color,
) {
    companion object {
        val SunsetPop = TrippyPalette(
            id = "sunset-pop",
            displayName = "Sunset Pop",
            emoji = "🌅",
            background = Color(0xFFFFF3E0),
            surface = Color(0xFFFFFDF6),
            ink = Color(0xFF2A1E3F),
            muted = Color(0xFF8A6D5B),
            primary = Color(0xFFFF6A3D),
            accent = Color(0xFFFFC42E),
            road = Color(0xFF2FBF71),
            flight = Color(0xFF2FA4FF),
            hybrid = Color(0xFF9B5DE5),
        )

        val TropicalPunch = TrippyPalette(
            id = "tropical-punch",
            displayName = "Tropical Punch",
            emoji = "🌴",
            background = Color(0xFFEFFCF5),
            surface = Color(0xFFFDFFFC),
            ink = Color(0xFF123A34),
            muted = Color(0xFF5B7C74),
            primary = Color(0xFF00BFA6),
            accent = Color(0xFFFFD23F),
            road = Color(0xFFFF7043),
            flight = Color(0xFF00A5CF),
            hybrid = Color(0xFF8AC926),
        )

        val DesertTrail = TrippyPalette(
            id = "desert-trail",
            displayName = "Desert Trail",
            emoji = "🏜️",
            background = Color(0xFFFFF1DC),
            surface = Color(0xFFFFFBF3),
            ink = Color(0xFF3A2417),
            muted = Color(0xFF9C7A5B),
            primary = Color(0xFFE8590C),
            accent = Color(0xFFF6BD16),
            road = Color(0xFFD9480F),
            flight = Color(0xFF1098AD),
            hybrid = Color(0xFFB5179E),
        )

        val BerryCool = TrippyPalette(
            id = "berry-cool",
            displayName = "Berry Cool",
            emoji = "🫐",
            background = Color(0xFFF4EEFF),
            surface = Color(0xFFFDFBFF),
            ink = Color(0xFF241436),
            muted = Color(0xFF7A6A93),
            primary = Color(0xFF7B2FF7),
            accent = Color(0xFFFF4D8D),
            road = Color(0xFFF15BB5),
            flight = Color(0xFF00BBF9),
            hybrid = Color(0xFF9B5DE5),
        )

        val all = listOf(SunsetPop, TropicalPunch, DesertTrail, BerryCool)

        fun named(id: String?): TrippyPalette = all.firstOrNull { it.id == id } ?: SunsetPop
    }
}

/** Access the active palette anywhere in the tree via MaterialTheme wrapper. */
val LocalTrippyPalette = compositionLocalOf { TrippyPalette.SunsetPop }

fun colorFor(mode: TravelMode, palette: TrippyPalette = TrippyPalette.SunsetPop): Color =
    when (mode) {
        TravelMode.ROAD -> palette.road
        TravelMode.FLIGHT -> palette.flight
        TravelMode.HYBRID -> palette.hybrid
    }

private fun schemeFor(p: TrippyPalette) = lightColorScheme(
    primary = p.primary,
    onPrimary = Color.White,
    secondary = p.accent,
    onSecondary = p.ink,
    tertiary = p.hybrid,
    background = p.background,
    onBackground = p.ink,
    surface = p.surface,
    onSurface = p.ink,
)

@Composable
fun TrippyTheme(
    preset: TrippyPalette = TrippyPalette.SunsetPop,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(LocalTrippyPalette provides preset) {
        MaterialTheme(colorScheme = schemeFor(preset), content = content)
    }
}
