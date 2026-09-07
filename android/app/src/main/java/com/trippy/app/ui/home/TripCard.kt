package com.trippy.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Muted
import com.trippy.app.ui.theme.colorFor
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip

@Composable
fun TripCard(trip: Trip, modifier: Modifier = Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            ModeBadge(trip.travelMode)
            Text(
                trip.status.name.lowercase().replaceFirstChar { it.titlecase() },
                style = MaterialTheme.typography.labelSmall,
                color = Muted,
            )
        }
        Text(trip.name, style = MaterialTheme.typography.titleMedium, color = Ink)
        Text(trip.routeLabel, style = MaterialTheme.typography.bodyMedium, color = Muted)
        Text(
            buildString {
                append(trip.dateRangeLabel)
                trip.budget?.let { append("  ·  $$it") }
            },
            style = MaterialTheme.typography.bodySmall,
            color = Ink.copy(alpha = 0.75f),
        )
    }
}

@Composable
fun ModeBadge(mode: TravelMode) {
    Text(
        text = mode.title,
        color = Color.White,
        style = MaterialTheme.typography.labelMedium,
        modifier = Modifier
            .clip(CircleShape)
            .background(colorFor(mode))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    )
}
