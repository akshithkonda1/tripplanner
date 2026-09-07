package com.trippy.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.trippy.app.data.TripStore
import com.trippy.app.ui.theme.Cream
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Muted
import com.trippy.app.ui.theme.Rust
import com.trippy.domain.TravelMode

@Composable
fun HomeScreen(
    store: TripStore,
    onOpenTrip: (String) -> Unit,
    onCreate: () -> Unit,
) {
    val trips by store.trips.collectAsState()
    val filter by store.filter.collectAsState()
    val visible = if (filter == null) trips else trips.filter { it.travelMode == filter }

    Scaffold(
        containerColor = Cream,
        floatingActionButton = {
            FloatingActionButton(onClick = onCreate, containerColor = Rust, contentColor = androidx.compose.ui.graphics.Color.White) {
                Icon(Icons.Filled.Add, contentDescription = "Create trip")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Trippy", style = MaterialTheme.typography.headlineMedium, color = Ink)
            Text(
                "Keep your mind on the open road — or the next city.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = filter == null,
                    onClick = { store.setFilter(null) },
                    label = { Text("All") },
                )
                TravelMode.entries.forEach { mode ->
                    FilterChip(
                        selected = filter == mode,
                        onClick = { store.setFilter(mode) },
                        label = { Text(mode.title) },
                    )
                }
            }
            if (visible.isEmpty()) {
                Text("No trips in this mode yet. Create a Road, Flight, or Hybrid trip.", color = Muted)
            } else {
                visible.forEach { trip ->
                    TripCard(
                        trip = trip,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(androidx.compose.ui.graphics.Color.White.copy(alpha = 0.85f))
                            .clickable { onOpenTrip(trip.id) }
                            .padding(16.dp),
                    )
                }
            }
        }
    }
}
