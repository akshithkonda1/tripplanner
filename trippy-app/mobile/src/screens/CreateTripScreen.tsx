import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { api } from '../services/api';

interface CreateTripScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export const CreateTripScreen: React.FC<CreateTripScreenProps> = ({ navigation }) => {
  const [tripName, setTripName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState<'family' | 'couple' | 'solo'>('solo');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTrip = async () => {
    if (!tripName || !origin || !destination || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // In production, geocode the locations to get coordinates
      // For now, using placeholder coordinates
      const trip = await api.createTrip({
        tripName,
        origin: {
          lat: 40.7128,
          lng: -74.0060,
          name: origin
        },
        destination: {
          lat: 34.0522,
          lng: -118.2437,
          name: destination
        },
        startDate,
        endDate,
        tripType,
        preferences: {}
      });

      Alert.alert('Success', 'Trip created! Start chatting with Sam to plan your route.');

      // Navigate to trip tabs
      navigation.navigate('TripTabs', {
        tripId: trip.tripId,
        userId: 'current-user-id' // Get from auth
      });
    } catch (error) {
      console.error('Failed to create trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Trip</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Trip Name</Text>
        <TextInput
          style={styles.input}
          value={tripName}
          onChangeText={setTripName}
          placeholder="Summer Road Trip 2024"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Starting From</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="New York, NY"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Going To</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="Los Angeles, CA"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Start Date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2024-07-01"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>End Date</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="2024-07-10"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Trip Type</Text>
        <View style={styles.tripTypeContainer}>
          {(['solo', 'couple', 'family'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tripTypeButton,
                tripType === type && styles.tripTypeButtonActive
              ]}
              onPress={() => setTripType(type)}
            >
              <Text
                style={[
                  styles.tripTypeText,
                  tripType === type && styles.tripTypeTextActive
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateTrip}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create Trip & Chat with Sam'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333'
  },
  form: {
    marginBottom: 30
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    color: '#333'
  },
  tripTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  tripTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center'
  },
  tripTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  tripTypeText: {
    fontSize: 14,
    color: '#555'
  },
  tripTypeTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  createButtonDisabled: {
    opacity: 0.5
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
});
