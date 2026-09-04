package com.trippy.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Muted

@Composable
fun ProfileScreen() {
    Column(
        Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall, color = Ink)
        Text("Shoestring traveler. Google sign-in lands in a later milestone.", color = Muted)
        Text("Apple  ·  Swift / SwiftUI", color = Ink)
        Text("Android  ·  Kotlin / Compose", color = Ink)
        Text("Cloud & AI  ·  AWS / Bedrock", color = Ink)
    }
}
