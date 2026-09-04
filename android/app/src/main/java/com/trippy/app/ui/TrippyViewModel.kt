package com.trippy.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trippy.app.data.TripStore
import com.trippy.domain.Trip
import kotlinx.coroutines.launch

class TrippyViewModel : ViewModel() {
    val store = TripStore()

    init {
        viewModelScope.launch { store.refresh() }
    }

    fun createTrip(trip: Trip, onDone: () -> Unit) {
        viewModelScope.launch {
            store.create(trip)
            onDone()
        }
    }
}
