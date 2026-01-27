import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { CreateTripScreen } from './src/screens/CreateTripScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { MapScreen } from './src/screens/MapScreen';
import { BookingScreen } from './src/screens/BookingScreen';

type RootStackParamList = {
  CreateTrip: undefined;
  TripTabs: {
    tripId: string;
    userId: string;
  };
  Booking: {
    location: string;
    checkIn: string;
    checkOut?: string;
    bookingLinks: Record<string, string>;
  };
};

type TripTabsParamList = {
  Chat: {
    tripId: string;
    userId: string;
  };
  Map: {
    tripId: string;
    itinerary?: any;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TripTabsParamList>();

interface TripTabsProps {
  route: {
    params: {
      tripId: string;
      userId: string;
    };
  };
}

function TripTabs({ route }: TripTabsProps) {
  const { tripId, userId } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        initialParams={{ tripId, userId }}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        initialParams={{ tripId }}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CreateTrip">
        <Stack.Screen
          name="CreateTrip"
          component={CreateTripScreen}
          options={{ title: 'New Trip' }}
        />
        <Stack.Screen
          name="TripTabs"
          component={TripTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: 'Book Accommodation' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
