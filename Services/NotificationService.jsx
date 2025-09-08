// services/NotificationService.js
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  
  // Register for push notifications
  async registerForPushNotifications() {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vehicle-alerts', {
        name: 'Vehicle Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({ 
        projectId: Constants.expoConfig.extra.eas.projectId 
      })).data;
      
      console.log('Push token:', token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Schedule local notification for immediate delivery
  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: { seconds: 1 },
    });
  }

  // Schedule notification for specific date
  async scheduleNotificationForDate(title, body, date, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        categoryIdentifier: 'vehicle-alert',
      },
      trigger: { date },
    });
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Cancel specific notification
  async cancelNotification(identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  // Get all scheduled notifications
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();