package com.trippy.app.ui

import androidx.lifecycle.ViewModel
import com.trippy.app.data.TripStore

class TrippyViewModel : ViewModel() {
    val store = TripStore()
}
