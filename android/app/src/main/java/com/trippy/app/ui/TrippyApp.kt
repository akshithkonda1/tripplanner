package com.trippy.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.trippy.app.ui.create.CreateTripScreen
import com.trippy.app.ui.explore.ExploreScreen
import com.trippy.app.ui.home.HomeScreen
import com.trippy.app.ui.profile.ProfileScreen
import com.trippy.app.ui.sam.SamChatScreen
import com.trippy.app.ui.trip.TripDetailScreen

private enum class Tab(val route: String, val label: String) {
    Home("home", "Home"),
    Explore("explore", "Explore"),
    Sam("sam", "Sam"),
    Profile("profile", "Profile"),
}

@Composable
fun TrippyApp(viewModel: TrippyViewModel = viewModel()) {
    val nav = rememberNavController()
    var tab by remember { mutableStateOf(Tab.Home) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { item ->
                    NavigationBarItem(
                        selected = tab == item,
                        onClick = {
                            tab = item
                            nav.navigate(item.route) {
                                popUpTo(Tab.Home.route) { inclusive = item == Tab.Home }
                                launchSingleTop = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = when (item) {
                                    Tab.Home -> Icons.Outlined.Home
                                    Tab.Explore -> Icons.Outlined.Explore
                                    Tab.Sam -> Icons.Outlined.AutoAwesome
                                    Tab.Profile -> Icons.Outlined.Person
                                },
                                contentDescription = item.label,
                            )
                        },
                        label = { Text(item.label) },
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = Tab.Home.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Tab.Home.route) {
                HomeScreen(
                    store = viewModel.store,
                    onOpenTrip = { nav.navigate("trip/$it") },
                    onCreate = { nav.navigate("create") },
                )
            }
            composable(Tab.Explore.route) { ExploreScreen() }
            composable(Tab.Sam.route) { SamChatScreen(trip = null) }
            composable(Tab.Profile.route) { ProfileScreen() }
            composable("create") {
                CreateTripScreen(
                    store = viewModel.store,
                    onDone = { nav.popBackStack() },
                )
            }
            composable(
                "trip/{tripId}",
                arguments = listOf(navArgument("tripId") { type = NavType.StringType }),
            ) { entry ->
                val id = entry.arguments?.getString("tripId").orEmpty()
                val trip = viewModel.store.trip(id)
                if (trip != null) {
                    TripDetailScreen(trip)
                }
            }
        }
    }
}
