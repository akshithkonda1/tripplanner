import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// Note: In production, use react-native-push-notification or expo-notifications
// This is a simplified implementation showing the structure

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: {
    tripId?: string;
    messageId?: string;
    type?: 'message' | 'itinerary_update' | 'trip_invite' | 'reminder';
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  messages: boolean;
  itineraryUpdates: boolean;
  tripInvites: boolean;
  reminders: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
}

const PREFERENCES_KEY = '@notification_preferences';
const FCM_TOKEN_KEY = '@fcm_token';

class NotificationService {
  private preferences: NotificationPreferences = {
    enabled: true,
    messages: true,
    itineraryUpdates: true,
    tripInvites: true,
    reminders: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  async initialize(): Promise<void> {
    await this.loadPreferences();
    await this.requestPermission();
    await this.registerForPushNotifications();
  }

  async requestPermission(): Promise<boolean> {
    // In production, use actual push notification library
    if (Platform.OS === 'ios') {
      // Request iOS notification permissions
      console.log('Requesting iOS notification permissions');
    }
    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // In production, get FCM token from Firebase
      const mockToken = `mock_fcm_token_${Date.now()}`;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);

      // Send token to backend
      await this.sendTokenToBackend(mockToken);

      return mockToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    // Send FCM token to backend for push notifications
    console.log('Sending FCM token to backend:', token);
  }

  async loadPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
    return this.preferences;
  }

  async savePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<void> {
    this.preferences = {...this.preferences, ...preferences};
    await AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify(this.preferences),
    );
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  shouldShowNotification(
    type: NonNullable<NotificationPayload['data']>['type'],
  ): boolean {
    if (!this.preferences.enabled) {
      return false;
    }
    if (this.isQuietHours()) {
      return false;
    }

    switch (type) {
      case 'message':
        return this.preferences.messages;
      case 'itinerary_update':
        return this.preferences.itineraryUpdates;
      case 'trip_invite':
        return this.preferences.tripInvites;
      case 'reminder':
        return this.preferences.reminders;
      default:
        return true;
    }
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.preferences.quietHoursStart
      .split(':')
      .map(Number);
    const [endHour, endMin] = this.preferences.quietHoursEnd
      .split(':')
      .map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes > endMinutes) {
      // Quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }

  async scheduleLocalNotification(
    notification: NotificationPayload,
    triggerTime: Date,
  ): Promise<void> {
    // In production, use actual scheduling
    console.log('Scheduling notification:', notification, 'at', triggerTime);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    console.log('Cancelling notification:', notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    console.log('Cancelling all notifications');
  }

  // Handle incoming notification
  handleNotification(notification: NotificationPayload): void {
    const type = notification.data?.type;

    if (!this.shouldShowNotification(type)) {
      return;
    }

    // Show in-app notification or navigate
    console.log('Handling notification:', notification);
  }

  // Schedule trip reminders
  async scheduleTripReminders(
    tripId: string,
    tripName: string,
    startDate: Date,
  ): Promise<void> {
    const reminders = [
      {days: 7, message: 'Your trip is in 1 week!'},
      {days: 3, message: 'Your trip is in 3 days!'},
      {days: 1, message: 'Your trip starts tomorrow!'},
      {days: 0, message: 'Your trip starts today! Have fun!'},
    ];

    for (const reminder of reminders) {
      const triggerDate = new Date(startDate);
      triggerDate.setDate(triggerDate.getDate() - reminder.days);
      triggerDate.setHours(9, 0, 0, 0); // 9 AM

      if (triggerDate > new Date()) {
        await this.scheduleLocalNotification(
          {
            id: `trip_${tripId}_reminder_${reminder.days}`,
            title: tripName,
            body: reminder.message,
            data: {
              tripId,
              type: 'reminder',
            },
          },
          triggerDate,
        );
      }
    }
  }
}

export const notificationService = new NotificationService();
