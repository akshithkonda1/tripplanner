package com.trippy.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.trippy.domain.TravelMode

val Cream = Color(0xFFF6F1E8)
val Ink = Color(0xFF1C2430)
val Rust = Color(0xFFC45C26)
val Pine = Color(0xFF2F6F4E)
val Sky = Color(0xFF2C5F8A)
val Plum = Color(0xFF6B4C9A)
val Muted = Color(0xFF6B665D)

fun colorFor(mode: TravelMode): Color = when (mode) {
    TravelMode.ROAD -> Pine
    TravelMode.FLIGHT -> Sky
    TravelMode.HYBRID -> Plum
}

private val colors = lightColorScheme(
    primary = Rust,
    onPrimary = Color.White,
    background = Cream,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    secondary = Pine,
)

@Composable
fun TrippyTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
