package com.trippy.app.ui.trip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.trippy.app.ui.home.ModeBadge
import com.trippy.app.ui.sam.SamChatScreen
import com.trippy.app.ui.theme.Cream
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Muted
import com.trippy.domain.TransportType
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip

@Composable
fun TripDetailScreen(trip: Trip) {
    val tabs = buildList {
        add("Itinerary")
        add("Map")
        if (trip.travelMode != TravelMode.ROAD) add("Flights")
        add("Budget")
        add("Chat")
    }
    var selected by remember { mutableIntStateOf(0) }

    Column(Modifier.fillMaxSize().background(Cream)) {
        ScrollableTabRow(selectedTabIndex = selected, containerColor = Cream, edgePadding = 12.dp) {
            tabs.forEachIndexed { index, title ->
                Tab(selected = selected == index, onClick = { selected = index }, text = { Text(title) })
            }
        }
        when (tabs[selected]) {
            "Itinerary" -> ItineraryPane(trip)
            "Map" -> MapPane(trip)
            "Flights" -> FlightsPane(trip)
            "Budget" -> BudgetPane(trip)
            "Chat" -> SamChatScreen(trip)
        }
    }
}

@Composable
private fun ItineraryPane(trip: Trip) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ModeBadge(trip.travelMode)
        Text(trip.name, style = MaterialTheme.typography.headlineSmall, color = Ink)
        Text(trip.routeLabel, style = MaterialTheme.typography.titleMedium, color = Ink)
        Text(trip.dateRangeLabel, color = Muted)
        if (trip.itinerary.isEmpty()) {
            Text(
                if (trip.travelMode == TravelMode.ROAD) {
                    "Ask Sam to sketch driving days and roadside stops."
                } else {
                    "Ask Sam to group this trip by city stays."
                },
                color = Muted,
            )
        } else {
            trip.itinerary.forEach { day ->
                Text(day.city ?: day.date, style = MaterialTheme.typography.titleMedium, color = Ink)
                Text(day.date, style = MaterialTheme.typography.labelSmall, color = Muted)
                day.items.forEach { item ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color.White.copy(alpha = 0.8f))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(item.name, color = Ink)
                            item.notes?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Muted) }
                        }
                        item.estimatedCost?.let { Text("$$it", style = MaterialTheme.typography.labelLarge) }
                    }
                }
            }
        }
    }
}

@Composable
private fun MapPane(trip: Trip) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            if (trip.travelMode == TravelMode.ROAD) {
                "Driving polyline + fuel overlay lands here (Google Maps)."
            } else {
                "Flight arcs between airports land here (Google Maps)."
            },
            color = Muted,
        )
    }
}

@Composable
private fun FlightsPane(trip: Trip) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        trip.legs.filter { it.transport == TransportType.FLIGHT }.forEach { leg ->
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .padding(12.dp),
            ) {
                Text("${leg.from.name} → ${leg.to.name}", style = MaterialTheme.typography.titleMedium)
                Text(
                    "About $${leg.estimatedCost ?: "—"} · cheapest-first search next",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        if (trip.datesFlexible) {
            Text("Flexible dates are on — Sam will look ±3 days for cheaper fares.", color = Muted)
        }
    }
}

@Composable
private fun BudgetPane(trip: Trip) {
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        val budget = trip.budget
        if (budget != null) {
            Text("Trip budget", color = Muted)
            Text("$$budget ${trip.homeCurrency}", style = MaterialTheme.typography.headlineLarge, color = Ink)
            Text(
                if (trip.travelMode == TravelMode.FLIGHT) {
                    "Flights, lodging, transit, food — split with the group."
                } else {
                    "Fuel, food, lodging, activities — split with the group."
                },
                color = Muted,
            )
        } else {
            Text("No budget set. Add one anytime — Trippy is built for shoestring trips.", color = Muted)
        }
    }
}
