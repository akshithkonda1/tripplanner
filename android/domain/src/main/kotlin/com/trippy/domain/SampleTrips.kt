package com.trippy.domain

object SampleTrips {
    val pacificCoast = Trip(
        id = "sample-road",
        name = "Pacific Coast Highway",
        travelMode = TravelMode.ROAD,
        origin = GeoLocation(37.7749, -122.4194, "San Francisco, CA"),
        destination = GeoLocation(34.0522, -118.2437, "Los Angeles, CA"),
        legs = listOf(
            TripLeg(
                id = "pch-drive",
                transport = TransportType.DRIVE,
                from = GeoLocation(37.7749, -122.4194, "San Francisco, CA"),
                to = GeoLocation(34.0522, -118.2437, "Los Angeles, CA"),
                estimatedCost = 180.0,
            )
        ),
        startDate = "2026-10-03",
        endDate = "2026-10-09",
        tripType = TripType.FRIENDS,
        budget = 900.0,
        status = TripStatus.UPCOMING,
        participants = listOf(Participant("you", "You")),
        itinerary = listOf(
            DayPlan(
                id = "pch-d1",
                date = "2026-10-03",
                city = "Santa Cruz",
                items = listOf(
                    ItineraryItem(
                        id = "pch-1",
                        type = StopType.DRIVE,
                        name = "SF → Santa Cruz via Hwy 1",
                        location = GeoLocation(36.9741, -122.0308, "Santa Cruz, CA"),
                        durationMinutes = 150,
                        estimatedCost = 28.0,
                        notes = "Leave after the morning fog lifts",
                    )
                )
            )
        ),
    )

    val japanHop = Trip(
        id = "sample-flight",
        name = "Two weeks in Japan",
        travelMode = TravelMode.FLIGHT,
        origin = GeoLocation(37.6213, -122.3790, "SFO"),
        destination = GeoLocation(35.5494, 139.7798, "HND"),
        legs = listOf(
            TripLeg(
                id = "jp-out",
                transport = TransportType.FLIGHT,
                from = GeoLocation(37.6213, -122.3790, "San Francisco"),
                to = GeoLocation(35.5494, 139.7798, "Tokyo"),
                estimatedCost = 640.0,
            ),
            TripLeg(
                id = "jp-rail",
                transport = TransportType.TRAIN,
                from = GeoLocation(35.6812, 139.7671, "Tokyo"),
                to = GeoLocation(34.9859, 135.7588, "Kyoto"),
                estimatedCost = 85.0,
            ),
        ),
        startDate = "2026-11-02",
        endDate = "2026-11-16",
        datesFlexible = true,
        tripType = TripType.COUPLE,
        budget = 2800.0,
        status = TripStatus.PLANNING,
        participants = listOf(Participant("you", "You"), Participant("plus-one", "Alex")),
        itinerary = listOf(
            DayPlan(
                id = "jp-d1",
                date = "2026-11-02",
                city = "Tokyo",
                items = listOf(
                    ItineraryItem(
                        id = "jp-1",
                        type = StopType.FLIGHT,
                        name = "SFO → HND",
                        location = GeoLocation(35.5494, 139.7798, "Haneda"),
                        durationMinutes = 650,
                        estimatedCost = 640.0,
                        currency = "USD",
                    )
                )
            )
        ),
    )

    val rockiesHybrid = Trip(
        id = "sample-hybrid",
        name = "Rockies fly & drive",
        travelMode = TravelMode.HYBRID,
        origin = GeoLocation(37.6213, -122.3790, "San Francisco"),
        destination = GeoLocation(40.7899, -111.9791, "Salt Lake City"),
        legs = listOf(
            TripLeg(
                id = "hy-fly-in",
                transport = TransportType.FLIGHT,
                from = GeoLocation(37.6213, -122.3790, "SFO"),
                to = GeoLocation(39.8561, -104.6737, "DEN"),
                estimatedCost = 148.0,
            ),
            TripLeg(
                id = "hy-drive",
                transport = TransportType.DRIVE,
                from = GeoLocation(39.7392, -104.9903, "Denver"),
                to = GeoLocation(40.7608, -111.8910, "Salt Lake City"),
                estimatedCost = 220.0,
            ),
            TripLeg(
                id = "hy-fly-out",
                transport = TransportType.FLIGHT,
                from = GeoLocation(40.7899, -111.9791, "SLC"),
                to = GeoLocation(37.6213, -122.3790, "SFO"),
                estimatedCost = 132.0,
            ),
        ),
        startDate = "2026-09-12",
        endDate = "2026-09-20",
        tripType = TripType.SOLO,
        budget = 1600.0,
        status = TripStatus.UPCOMING,
        participants = listOf(Participant("you", "You")),
    )

    val all: List<Trip> = listOf(pacificCoast, japanHop, rockiesHybrid)
}
