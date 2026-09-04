package com.trippy.app.ui.create

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Muted
import com.trippy.domain.GeoLocation
import com.trippy.domain.Participant
import com.trippy.domain.TransportType
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip
import com.trippy.domain.TripLeg
import com.trippy.domain.TripStatus
import com.trippy.domain.TripType
import java.util.UUID

@Composable
fun CreateTripScreen(onCreate: (Trip) -> Unit, onDone: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var mode by remember { mutableStateOf(TravelMode.ROAD) }
    var origin by remember { mutableStateOf("") }
    var destination by remember { mutableStateOf("") }
    var extraCity by remember { mutableStateOf("") }
    val extraCities = remember { mutableStateListOf<String>() }
    var start by remember { mutableStateOf("2026-10-01") }
    var end by remember { mutableStateOf("2026-10-08") }
    var tripType by remember { mutableStateOf(TripType.SOLO) }
    var budget by remember { mutableStateOf("") }
    var flexible by remember { mutableStateOf(false) }

    val canSave = name.isNotBlank() && origin.isNotBlank() && destination.isNotBlank()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("New trip", style = MaterialTheme.typography.headlineSmall, color = Ink)
        Text("How are you traveling?", style = MaterialTheme.typography.titleSmall, color = Ink)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TravelMode.entries.forEach { option ->
                FilterChip(
                    selected = mode == option,
                    onClick = { mode = option },
                    label = { Text(option.title) },
                )
            }
        }
        Text(mode.subtitle, color = Muted, style = MaterialTheme.typography.bodySmall)

        OutlinedTextField(name, { name = it }, label = { Text("Trip name") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            origin,
            { origin = it },
            label = { Text(if (mode == TravelMode.FLIGHT) "From (airport or city)" else "From") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            destination,
            { destination = it },
            label = { Text(if (mode == TravelMode.FLIGHT) "To (airport or city)" else "To") },
            modifier = Modifier.fillMaxWidth(),
        )

        if (mode != TravelMode.ROAD) {
            extraCities.forEach { Text("• $it", color = Ink) }
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    extraCity,
                    { extraCity = it },
                    label = { Text("Add a city") },
                    modifier = Modifier.weight(1f),
                )
                TextButton(onClick = {
                    val trimmed = extraCity.trim()
                    if (trimmed.isNotEmpty()) {
                        extraCities += trimmed
                        extraCity = ""
                    }
                }) { Text("Add") }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Flexible dates (±3 days)", modifier = Modifier.weight(1f))
                Switch(checked = flexible, onCheckedChange = { flexible = it })
            }
        }

        OutlinedTextField(start, { start = it }, label = { Text("Start (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(end, { end = it }, label = { Text("End (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())

        Text("Traveling as", style = MaterialTheme.typography.titleSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TripType.entries.forEach { type ->
                FilterChip(
                    selected = tripType == type,
                    onClick = { tripType = type },
                    label = { Text(type.name.lowercase().replaceFirstChar { it.titlecase() }) },
                )
            }
        }
        OutlinedTextField(budget, { budget = it }, label = { Text("Budget (optional)") }, modifier = Modifier.fillMaxWidth())

        Button(
            onClick = {
                onCreate(buildTrip(name, mode, origin, destination, extraCities, start, end, tripType, budget, flexible))
            },
            enabled = canSave,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Create trip")
        }
        TextButton(onClick = onDone, modifier = Modifier.fillMaxWidth()) { Text("Cancel") }
    }
}

private fun buildTrip(
    name: String,
    mode: TravelMode,
    origin: String,
    destination: String,
    extraCities: List<String>,
    start: String,
    end: String,
    tripType: TripType,
    budget: String,
    flexible: Boolean,
): Trip {
    val from = GeoLocation(0.0, 0.0, origin.trim())
    val to = GeoLocation(0.0, 0.0, destination.trim())
    val firstTransport = if (mode == TravelMode.ROAD) TransportType.DRIVE else TransportType.FLIGHT
    val legs = mutableListOf(
        TripLeg(UUID.randomUUID().toString(), firstTransport, from, to)
    )
    var previous = to
    extraCities.forEach { city ->
        val next = GeoLocation(0.0, 0.0, city)
        legs += TripLeg(
            id = UUID.randomUUID().toString(),
            transport = if (mode == TravelMode.HYBRID) TransportType.DRIVE else TransportType.FLIGHT,
            from = previous,
            to = next,
        )
        previous = next
    }
    return Trip(
        id = UUID.randomUUID().toString(),
        name = name.trim(),
        travelMode = mode,
        origin = from,
        destination = if (extraCities.isEmpty()) to else previous,
        legs = legs,
        startDate = start,
        endDate = end,
        datesFlexible = flexible && mode != TravelMode.ROAD,
        tripType = tripType,
        budget = budget.toDoubleOrNull(),
        status = TripStatus.PLANNING,
        participants = listOf(Participant("you", "You")),
    )
}
