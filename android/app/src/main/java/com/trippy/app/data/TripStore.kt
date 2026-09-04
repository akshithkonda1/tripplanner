package com.trippy.app.data

import com.trippy.domain.SampleTrips
import com.trippy.domain.TravelMode
import com.trippy.domain.Trip
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class TripStore {
    private val _trips = MutableStateFlow(SampleTrips.all)
    val trips: StateFlow<List<Trip>> = _trips.asStateFlow()

    private val _filter = MutableStateFlow<TravelMode?>(null)
    val filter: StateFlow<TravelMode?> = _filter.asStateFlow()

    fun setFilter(mode: TravelMode?) {
        _filter.value = mode
    }

    fun add(trip: Trip) {
        _trips.update { listOf(trip) + it }
    }

    fun trip(id: String): Trip? = _trips.value.firstOrNull { it.id == id }

    fun visible(): List<Trip> {
        val mode = _filter.value
        return if (mode == null) _trips.value else _trips.value.filter { it.travelMode == mode }
    }
}
