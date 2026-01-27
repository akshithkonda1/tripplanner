import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

interface Stop {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: string;
}

interface MapScreenProps {
  route: {
    params: {
      tripId: string;
      itinerary?: any;
    };
  };
}

export const MapScreen: React.FC<MapScreenProps> = ({ route }) => {
  const { itinerary } = route.params;
  const [stops, setStops] = useState<Stop[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  useEffect(() => {
    if (itinerary) {
      // Extract stops from itinerary
      const extractedStops: Stop[] = [];
      itinerary.days?.forEach((day: any) => {
        day.items?.forEach((item: any) => {
          if (item.location) {
            extractedStops.push({
              id: Math.random().toString(),
              name: item.name,
              coordinates: {
                lat: item.location.lat,
                lng: item.location.lng
              },
              type: item.type
            });
          }
        });
      });

      setStops(extractedStops);

      // Create route polyline
      const coords = extractedStops.map(stop => ({
        latitude: stop.coordinates.lat,
        longitude: stop.coordinates.lng
      }));
      setRouteCoordinates(coords);
    }
  }, [itinerary]);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'accommodation': return '#FF6B6B';
      case 'meal': return '#4ECDC4';
      case 'activity': return '#95E1D3';
      case 'drive': return '#38A3A5';
      default: return '#007AFF';
    }
  };

  if (stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No route data available. Start planning your trip in the chat!</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: stops[0].coordinates.lat,
    longitude: stops[0].coordinates.lng,
    latitudeDelta: 5,
    longitudeDelta: 5
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT} // Uses Apple Maps on iOS
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.coordinates.lat,
              longitude: stop.coordinates.lng
            }}
            title={stop.name}
            description={stop.type}
            pinColor={getMarkerColor(stop.type)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(stop.type) }
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  markerContainer: {
    alignItems: 'center'
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  }
});
