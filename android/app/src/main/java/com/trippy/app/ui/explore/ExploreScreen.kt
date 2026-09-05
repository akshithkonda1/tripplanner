package com.trippy.app.ui.explore

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
fun ExploreScreen() {
    Column(
        Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Explore", style = MaterialTheme.typography.headlineSmall, color = Ink)
        Text("On the road", style = MaterialTheme.typography.titleMedium, color = Ink)
        Text("Cheap campsites · scenic pull-offs · lowest fuel this week", color = Muted)
        Text("Longer trips", style = MaterialTheme.typography.titleMedium, color = Ink)
        Text("City-hop fares · hostels with weekly rates · night trains", color = Muted)
    }
}
