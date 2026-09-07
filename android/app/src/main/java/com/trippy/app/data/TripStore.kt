package com.trippy.app.data

import com.trippy.domain.SampleTrips
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip
import com.trippy.domain.api.CreateTripRequest
import com.trippy.domain.api.TrippyApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.withContext

class TripStore(
    private val api: TrippyApi = TrippyApi.fromEnvironment(),
) {
    private val _trips = MutableStateFlow(SampleTrips.all)
    val trips: StateFlow<List<Trip>> = _trips.asStateFlow()

    private val _filter = MutableStateFlow<TravelMode?>(null)
    val filter: StateFlow<TravelMode?> = _filter.asStateFlow()

    fun setFilter(mode: TravelMode?) {
        _filter.value = mode
    }

    fun add(trip: Trip) {
        _trips.update { listOf(trip) + it.filterNot { existing -> existing.id == trip.id } }
    }

    fun trip(id: String): Trip? = _trips.value.firstOrNull { it.id == id }

    suspend fun refresh() {
        if (!api.isConfigured) return
        val remote = withContext(Dispatchers.IO) {
            runCatching { api.listTrips() }.getOrNull()
        } ?: return
        _trips.value = remote + SampleTrips.all.filter { sample ->
            remote.none { it.id == sample.id }
        }
    }

    suspend fun create(trip: Trip): Trip {
        val saved = if (api.isConfigured) {
            withContext(Dispatchers.IO) {
                runCatching { api.createTrip(CreateTripRequest.from(trip)) }.getOrNull()
            }
        } else {
            null
        } ?: trip
        add(saved)
        return saved
    }
}
