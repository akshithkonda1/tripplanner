import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  notificationService,
  NotificationPreferences,
} from '../services/notifications';

export const NotificationSettingsScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences(),
  );

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await notificationService.loadPreferences();
    setPreferences(prefs);
  };

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean | string,
  ) => {
    const newPrefs = {...preferences, [key]: value};
    setPreferences(newPrefs);
    await notificationService.savePreferences({[key]: value});
  };

  const renderToggle = (
    title: string,
    subtitle: string,
    key: keyof NotificationPreferences,
    disabled: boolean = false,
  ) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, disabled && styles.textDisabled]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={preferences[key] as boolean}
        onValueChange={value => updatePreference(key, value)}
        disabled={disabled || !preferences.enabled}
        trackColor={{false: '#e0e0e0', true: '#81D4FA'}}
        thumbColor={preferences[key] ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Master Control</Text>
        {renderToggle(
          'Push Notifications',
          'Enable or disable all notifications',
          'enabled',
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        {renderToggle(
          'Messages',
          'New messages from trip participants',
          'messages',
          !preferences.enabled,
        )}
        {renderToggle(
          'Itinerary Updates',
          'When Sam updates your trip itinerary',
          'itineraryUpdates',
          !preferences.enabled,
        )}
        {renderToggle(
          'Trip Invites',
          'When someone invites you to a trip',
          'tripInvites',
          !preferences.enabled,
        )}
        {renderToggle(
          'Reminders',
          'Trip countdown and departure reminders',
          'reminders',
          !preferences.enabled,
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        {renderToggle(
          'Enable Quiet Hours',
          'Silence notifications during set times',
          'quietHoursEnabled',
          !preferences.enabled,
        )}

        {preferences.quietHoursEnabled && preferences.enabled && (
          <View style={styles.timeSection}>
            <TouchableOpacity style={styles.timeRow}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <Text style={styles.timeValue}>
                {preferences.quietHoursStart}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeRow}>
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeValue}>{preferences.quietHoursEnd}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Push notifications keep you updated on trip changes and messages from
          your travel companions. You can customize which notifications you
          receive above.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  textDisabled: {
    color: '#999',
  },
  timeSection: {
    paddingBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeValue: {
    fontSize: 16,
    color: '#007AFF',
  },
  infoSection: {
    padding: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
