package com.trippy.domain

enum class TravelMode {
    ROAD, FLIGHT, HYBRID;

    val title: String
        get() = when (this) {
            ROAD -> "Road"
            FLIGHT -> "Flight"
            HYBRID -> "Hybrid"
        }

    val subtitle: String
        get() = when (this) {
            ROAD -> "Drive the whole way"
            FLIGHT -> "Longer trips, city hops, flights"
            HYBRID -> "Fly in, explore on the ground, fly out"
        }

    fun toApi(): String = name.lowercase()

    companion object {
        fun fromApi(value: String?): TravelMode =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: ROAD
    }
}

enum class TransportType { DRIVE, FLIGHT, TRAIN, BUS, FERRY, TRANSIT, WALK }

enum class TripType { SOLO, COUPLE, FAMILY, FRIENDS }

enum class TripStatus { PLANNING, UPCOMING, ACTIVE, COMPLETED }

enum class StopType { DRIVE, FLIGHT, FOOD, LODGING, ACTIVITY, FUEL, REST, TRANSIT }

data class GeoLocation(
    val lat: Double,
    val lng: Double,
    val name: String,
    val timeZoneIdentifier: String? = null,
)

data class TripLeg(
    val id: String,
    val transport: TransportType,
    val from: GeoLocation,
    val to: GeoLocation,
    val estimatedCost: Double? = null,
)

data class ItineraryItem(
    val id: String,
    val type: StopType,
    val name: String,
    val location: GeoLocation,
    val durationMinutes: Int,
    val estimatedCost: Double? = null,
    val currency: String? = null,
    val notes: String? = null,
    val isBooked: Boolean = false,
)

data class DayPlan(
    val id: String,
    val date: String,
    val city: String? = null,
    val items: List<ItineraryItem> = emptyList(),
)

data class Participant(
    val id: String,
    val name: String,
)

data class Trip(
    val id: String,
    val name: String,
    val travelMode: TravelMode,
    val origin: GeoLocation,
    val destination: GeoLocation,
    val legs: List<TripLeg> = emptyList(),
    val startDate: String,
    val endDate: String,
    val datesFlexible: Boolean = false,
    val tripType: TripType = TripType.SOLO,
    val budget: Double? = null,
    val homeCurrency: String = "USD",
    val status: TripStatus = TripStatus.PLANNING,
    val participants: List<Participant> = emptyList(),
    val itinerary: List<DayPlan> = emptyList(),
) {
    val routeLabel: String get() = "${origin.name} → ${destination.name}"
    val dateRangeLabel: String get() = "$startDate – $endDate"
}

data class ChatMessage(
    val id: String,
    val tripId: String,
    val userId: String,
    val message: String,
    val fromSam: Boolean,
)
