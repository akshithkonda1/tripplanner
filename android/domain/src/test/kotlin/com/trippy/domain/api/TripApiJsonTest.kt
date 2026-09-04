package com.trippy.domain.api

import com.trippy.domain.SampleTrips
import com.trippy.domain.TravelMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TripApiJsonTest {
    @Test
    fun `create request for a flight trip matches the AWS contract`() {
        val request = CreateTripRequest.from(SampleTrips.japanHop)
        val encoded = tripApiJson.encodeToString(CreateTripRequest.serializer(), request)

        assertEquals("flight", request.travelMode)
        assertTrue(request.datesFlexible)
        assertEquals("couple", request.tripType)
        assertTrue(encoded.contains("\"travelMode\":\"flight\""))
        assertTrue(encoded.contains("\"tripName\":\"Two weeks in Japan\""))
        assertTrue(encoded.contains("\"transport\":\"flight\""))
    }

    @Test
    fun `decodes an AWS create-trip response into Flight Mode`() {
        val json = javaClass.getResource("/api/create-trip-response.flight.json")!!.readText()
        val trip = tripApiJson.decodeFromString(CreateTripResponse.serializer(), json).trip.toDomain()

        assertEquals("trip-flight-1", trip.id)
        assertEquals("Two weeks in Japan", trip.name)
        assertEquals(TravelMode.FLIGHT, trip.travelMode)
        assertTrue(trip.datesFlexible)
        assertEquals(1, trip.legs.size)
        assertEquals("SFO", trip.origin.name)
    }

    @Test
    fun `unknown travelMode from AWS becomes road`() {
        val json = """
            {
              "trip": {
                "tripId": "x",
                "tripName": "Legacy",
                "origin": {"lat": 0, "lng": 0, "name": "A"},
                "destination": {"lat": 1, "lng": 1, "name": "B"},
                "startDate": "2026-01-01",
                "endDate": "2026-01-02"
              }
            }
        """.trimIndent()
        val trip = tripApiJson.decodeFromString(GetTripResponse.serializer(), json).trip.toDomain()
        assertEquals(TravelMode.ROAD, trip.travelMode)
    }

    @Test
    fun `unconfigured API client refuses to call AWS`() {
        val api = TrippyApi()
        assertEquals(false, api.isConfigured)
    }
}
