package com.trippy.app.ui.sam

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.trippy.app.ui.theme.Cream
import com.trippy.app.ui.theme.Ink
import com.trippy.app.ui.theme.Rust
import com.trippy.domain.ChatMessage
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip
import java.util.UUID

@Composable
fun SamChatScreen(trip: Trip?) {
    val messages = remember(trip?.id) {
        mutableStateListOf(greeting(trip))
    }
    val draft = remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(Cream)) {
        LazyColumn(
            modifier = Modifier.weight(1f).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(messages, key = { it.id }) { message ->
                val alignment = if (message.fromSam) Alignment.Start else Alignment.End
                Column(Modifier.fillMaxWidth(), horizontalAlignment = alignment) {
                    Text(
                        message.message,
                        color = if (message.fromSam) Ink else Color.White,
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (message.fromSam) Color.White.copy(alpha = 0.9f) else Ink)
                            .padding(12.dp),
                    )
                }
            }
        }
        Row(
            Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = draft.value,
                onValueChange = { draft.value = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Ask Sam…") },
            )
            IconButton(
                onClick = {
                    val text = draft.value.trim()
                    if (text.isEmpty()) return@IconButton
                    val tripId = trip?.id ?: "inbox"
                    messages += ChatMessage(UUID.randomUUID().toString(), tripId, "you", text, fromSam = false)
                    messages += ChatMessage(UUID.randomUUID().toString(), tripId, "SAM", reply(trip, text), fromSam = true)
                    draft.value = ""
                },
                enabled = draft.value.isNotBlank(),
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Rust)
            }
        }
    }
}

private fun greeting(trip: Trip?): ChatMessage {
    val text = when (trip?.travelMode) {
        TravelMode.ROAD -> "I'm Sam. Want scenic miles, cheap gas, or a looser pace on ${trip.name}?"
        TravelMode.FLIGHT -> "I'm Sam. ${trip.name} is a longer trip — I can sketch city stays and hunt cheaper fares."
        TravelMode.HYBRID -> "I'm Sam. Fly, drive, fly — I'll treat each leg of ${trip.name} by how you actually move."
        null -> "I'm Sam, your trip co-pilot. Road, flight, or hybrid — tell me where you want to go."
    }
    return ChatMessage(UUID.randomUUID().toString(), trip?.id ?: "inbox", "SAM", text, fromSam = true)
}

private fun reply(trip: Trip?, text: String): String = when (trip?.travelMode ?: TravelMode.ROAD) {
    TravelMode.FLIGHT -> "Got it — “$text”. When Bedrock is wired I’ll search fares cheapest-first and group days by city stay."
    TravelMode.HYBRID -> "Got it — “$text”. I’ll keep air legs and drive legs on the same itinerary so the budget stays one number."
    TravelMode.ROAD -> "Got it — “$text”. When Bedrock is wired I’ll sketch driving days, cheap fuel, and places to sleep."
}
