package com.trippy.domain.api

import com.trippy.domain.GeoLocation
import com.trippy.domain.Participant
import com.trippy.domain.TransportType
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip
import com.trippy.domain.TripLeg
import com.trippy.domain.TripStatus
import com.trippy.domain.TripType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

val tripApiJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

@Serializable
data class LocationDto(
    val lat: Double,
    val lng: Double,
    val name: String,
    val timeZoneIdentifier: String? = null,
) {
    fun toDomain() = GeoLocation(lat, lng, name, timeZoneIdentifier)

    companion object {
        fun from(location: GeoLocation) = LocationDto(
            lat = location.lat,
            lng = location.lng,
            name = location.name,
            timeZoneIdentifier = location.timeZoneIdentifier,
        )
    }
}

@Serializable
data class TripLegDto(
    val id: String? = null,
    val transport: String,
    val from: LocationDto,
    val to: LocationDto,
    val estimatedCost: Double? = null,
) {
    fun toDomain() = TripLeg(
        id = id ?: "${from.name}-${to.name}",
        transport = TransportType.entries.firstOrNull { it.name.equals(transport, ignoreCase = true) }
            ?: TransportType.DRIVE,
        from = from.toDomain(),
        to = to.toDomain(),
        estimatedCost = estimatedCost,
    )

    companion object {
        fun from(leg: TripLeg) = TripLegDto(
            id = leg.id,
            transport = leg.transport.name.lowercase(),
            from = LocationDto.from(leg.from),
            to = LocationDto.from(leg.to),
            estimatedCost = leg.estimatedCost,
        )
    }
}

@Serializable
data class CreateTripRequest(
    val tripName: String,
    val travelMode: String,
    val origin: LocationDto,
    val destination: LocationDto,
    val legs: List<TripLegDto> = emptyList(),
    val startDate: String,
    val endDate: String,
    val datesFlexible: Boolean = false,
    val tripType: String,
    val homeCurrency: String = "USD",
    val preferences: Preferences = Preferences(),
) {
    @Serializable
    data class Preferences(val budget: Double? = null)

    companion object {
        fun from(trip: Trip) = CreateTripRequest(
            tripName = trip.name,
            travelMode = trip.travelMode.toApi(),
            origin = LocationDto.from(trip.origin),
            destination = LocationDto.from(trip.destination),
            legs = trip.legs.map { TripLegDto.from(it) },
            startDate = trip.startDate,
            endDate = trip.endDate,
            datesFlexible = trip.datesFlexible,
            tripType = trip.tripType.name.lowercase(),
            homeCurrency = trip.homeCurrency,
            preferences = Preferences(budget = trip.budget),
        )
    }
}

@Serializable
data class TripDto(
    val tripId: String? = null,
    val id: String? = null,
    val tripName: String? = null,
    val name: String? = null,
    val travelMode: String? = null,
    val origin: LocationDto,
    val destination: LocationDto,
    val legs: List<TripLegDto> = emptyList(),
    val startDate: String,
    val endDate: String,
    val datesFlexible: Boolean = false,
    val tripType: String? = null,
    val homeCurrency: String = "USD",
    val status: String? = null,
    val participants: List<String> = emptyList(),
) {
    fun toDomain(): Trip = Trip(
        id = tripId ?: id ?: error("Trip is missing tripId"),
        name = tripName ?: name ?: "Untitled trip",
        travelMode = TravelMode.fromApi(travelMode),
        origin = origin.toDomain(),
        destination = destination.toDomain(),
        legs = legs.map { it.toDomain() },
        startDate = startDate,
        endDate = endDate,
        datesFlexible = datesFlexible,
        tripType = TripType.entries.firstOrNull { it.name.equals(tripType, ignoreCase = true) }
            ?: TripType.SOLO,
        budget = null,
        homeCurrency = homeCurrency,
        status = TripStatus.entries.firstOrNull { it.name.equals(status, ignoreCase = true) }
            ?: TripStatus.PLANNING,
        participants = participants.map { Participant(it, it) },
    )
}

@Serializable
data class CreateTripResponse(
    val success: Boolean = true,
    val trip: TripDto,
)

@Serializable
data class ListTripsResponse(
    val trips: List<TripDto> = emptyList(),
)

@Serializable
data class GetTripResponse(
    val trip: TripDto,
)

@Serializable
data class PlanTripRequest(
    val message: String,
    val travelMode: String? = null,
)
