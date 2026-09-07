package com.trippy.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TravelModeTest {
    @Test
    fun `unknown api value defaults to road so older clients keep working`() {
        assertEquals(TravelMode.ROAD, TravelMode.fromApi(null))
        assertEquals(TravelMode.ROAD, TravelMode.fromApi("scenic"))
    }

    @Test
    fun `api round trip stays lowercase`() {
        assertEquals("flight", TravelMode.FLIGHT.toApi())
        assertEquals(TravelMode.HYBRID, TravelMode.fromApi("hybrid"))
    }

    @Test
    fun `sample set covers every travel mode`() {
        val modes = SampleTrips.all.map { it.travelMode }.toSet()
        assertTrue(modes.containsAll(TravelMode.entries))
    }
}
