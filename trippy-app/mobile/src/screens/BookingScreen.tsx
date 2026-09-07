import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
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

// No logo image assets are bundled yet, so each platform gets a colored
// initial badge instead of require()-ing images that don't exist.
const PLATFORM_STYLE: Record<string, {label: string; color: string}> = {
  booking: {label: 'B', color: '#003580'},
  expedia: {label: 'E', color: '#FFC72C'},
  marriott: {label: 'M', color: '#8A1538'},
  hyatt: {label: 'H', color: '#4B2E83'},
  ihg: {label: 'I', color: '#5A2D81'},
  viator: {label: 'V', color: '#FF5722'},
};

export const BookingScreen: React.FC<BookingScreenProps> = ({route}) => {
  const {location, checkIn, checkOut, bookingLinks} = route.params;

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
        <Text style={styles.subtitle}>{location}</Text>
        <Text style={styles.dates}>
          {checkIn} {checkOut && `- ${checkOut}`}
        </Text>
      </View>

      <Text style={styles.description}>
        Sam couldn't find availability directly. Check these platforms for the
        best options:
      </Text>

      <View style={styles.platformsContainer}>
        {Object.entries(bookingLinks).map(([platform, url]) => (
          <TouchableOpacity
            key={platform}
            style={styles.platformCard}
            onPress={() => openBookingLink(platform, url)}>
            <View
              style={[
                styles.logoBadge,
                {backgroundColor: PLATFORM_STYLE[platform]?.color || '#007AFF'},
              ]}>
              <Text style={styles.logoBadgeText}>
                {PLATFORM_STYLE[platform]?.label ||
                  platform.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.platformName}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Text>
            <Text style={styles.searchText}>Search on {platform}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Pro Tip</Text>
        <Text style={styles.tipText}>
          Compare prices across platforms. Sometimes the same hotel has
          different rates on different booking sites!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  dates: {
    fontSize: 14,
    color: '#999',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchText: {
    fontSize: 12,
    color: '#007AFF',
  },
  tip: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFE066',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
