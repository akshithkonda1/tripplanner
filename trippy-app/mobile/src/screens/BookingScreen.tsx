import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking
} from 'react-native';

interface BookingScreenProps {
  route: {
    params: {
      location: string;
      checkIn: string;
      checkOut?: string;
      bookingLinks: {
        booking: string;
        expedia: string;
        marriott: string;
        hyatt: string;
        ihg: string;
        viator: string;
      };
    };
  };
}

const PLATFORM_NAMES: Record<string, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia',
  marriott: 'Marriott',
  hyatt: 'Hyatt',
  ihg: 'IHG',
  viator: 'Viator (Activities)'
};

export const BookingScreen: React.FC<BookingScreenProps> = ({ route }) => {
  const { location, checkIn, checkOut, bookingLinks } = route.params;

  const openBookingLink = async (platform: string, url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Can't handle url: " + url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Accommodation</Text>
        <Text style={styles.subtitle}>
          {location}
        </Text>
        <Text style={styles.dates}>
          {checkIn} {checkOut && `- ${checkOut}`}
        </Text>
      </View>

      <Text style={styles.description}>
        Sam couldn't find availability directly. Check these platforms for the best options:
      </Text>

      <View style={styles.platformsContainer}>
        {Object.entries(bookingLinks).map(([platform, url]) => (
          <TouchableOpacity
            key={platform}
            style={styles.platformCard}
            onPress={() => openBookingLink(platform, url)}
          >
            <Text style={styles.platformName}>
              {PLATFORM_NAMES[platform] || platform}
            </Text>
            <Text style={styles.searchText}>Search &rarr;</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Pro Tip</Text>
        <Text style={styles.tipText}>
          Compare prices across platforms. Sometimes the same hotel has different rates on different booking sites!
        </Text>
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
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4
  },
  dates: {
    fontSize: 14,
    color: '#999'
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  searchText: {
    fontSize: 14,
    color: '#007AFF'
  },
  tip: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFE066'
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
});
