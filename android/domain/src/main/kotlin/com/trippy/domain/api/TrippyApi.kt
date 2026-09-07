package com.trippy.domain.api

import com.trippy.domain.Trip
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI

class TrippyApi(
    private val baseUrl: String = DEFAULT_BASE_URL,
) {
    val isConfigured: Boolean
        get() = !baseUrl.contains("your-api.execute-api")

    fun createTrip(request: CreateTripRequest): Trip {
        val body = post("/trips", tripApiJson.encodeToString(CreateTripRequest.serializer(), request))
        return tripApiJson.decodeFromString(CreateTripResponse.serializer(), body).trip.toDomain()
    }

    fun listTrips(): List<Trip> {
        val body = get("/trips")
        return tripApiJson.decodeFromString(ListTripsResponse.serializer(), body).trips.map { it.toDomain() }
    }

    fun getTrip(tripId: String): Trip {
        val body = get("/trips/$tripId")
        return tripApiJson.decodeFromString(GetTripResponse.serializer(), body).trip.toDomain()
    }

    fun planTrip(tripId: String, message: String, travelMode: String?): String {
        val payload = tripApiJson.encodeToString(
            PlanTripRequest.serializer(),
            PlanTripRequest(message = message, travelMode = travelMode),
        )
        return post("/trips/$tripId/plan", payload)
    }

    private fun get(path: String): String = request("GET", path, null)

    private fun post(path: String, json: String): String = request("POST", path, json)

    private fun request(method: String, path: String, json: String?): String {
        if (!isConfigured) {
            throw IllegalStateException("HTTP_API_URL is not configured")
        }
        val connection = URI.create(baseUrl.trimEnd('/') + path).toURL().openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 15_000
        connection.readTimeout = 30_000
        connection.setRequestProperty("Accept", "application/json")
        if (json != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(json.toByteArray()) }
        }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.bufferedReader()?.readText().orEmpty()
        if (code !in 200..299) {
            throw IOException("AWS API $method $path failed ($code): $body")
        }
        return body
    }

    companion object {
        const val DEFAULT_BASE_URL = "https://your-api.execute-api.us-east-1.amazonaws.com"

        fun fromEnvironment(): TrippyApi {
            val url = System.getenv("HTTP_API_URL") ?: DEFAULT_BASE_URL
            return TrippyApi(url)
        }
    }
}
