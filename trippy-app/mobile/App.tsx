import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import Icon from 'react-native-vector-icons/Ionicons';

import {CreateTripScreen} from './src/screens/CreateTripScreen';
import {ChatScreen} from './src/screens/ChatScreen';
import {MapScreen} from './src/screens/MapScreen';
import {BookingScreen} from './src/screens/BookingScreen';
import {GroupChatScreen} from './src/screens/GroupChatScreen';
import {NotificationSettingsScreen} from './src/screens/NotificationSettingsScreen';

enableScreens();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TripTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
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
      })}>
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
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
          options={{title: 'New Trip'}}
        />
        <Stack.Screen
          name="TripTabs"
          component={TripTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="GroupChat"
          component={GroupChatScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{title: 'Notifications'}}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{title: 'Book Accommodation'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
