// services/NotificationService.js
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  
  async registerForPushNotifications() {
    let token;
    
    try {
      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('vehicle-alerts', {
          name: 'Vehicle Document Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: true,
        });
      }

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Check if permissions were granted
      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }
      
      // Get the project ID with better error handling
      let projectId;
      try {
        projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                   Constants.easConfig?.projectId || 
                   Constants.expoConfig?.projectId ||
                   Constants.manifest?.extra?.eas?.projectId;
                   
        if (!projectId) {
          console.warn('No project ID found in Expo config. Push notifications will not work.');
          console.warn('Please add projectId to your app.json under expo.extra.eas.projectId');
          return null;
        }
      } catch (error) {
        console.error('Error accessing project ID:', error);
        return null;
      }

      // Get the push token with better error handling
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId
        });
        
        token = tokenData.data;
        console.log('Push token obtained successfully');
        return token;
      } catch (tokenError) {
        console.error('Error getting push token:', tokenError);
        
        // Check if it's a Firebase initialization error
        if (tokenError.message && tokenError.message.includes('FirebaseApp')) {
          console.warn('Firebase initialization error. Please ensure Firebase is properly configured.');
          console.warn('For Android: Follow https://docs.expo.dev/push-notifications/fcm-credentials/');
          console.warn('For iOS: Ensure you have proper certificates configured');
        }
        
        // If push token fails, still allow app to work with local notifications
        console.log('Falling back to local notifications only');
        return null;
      }
      
    } catch (error) {
      console.error('Error in registerForPushNotifications:', error);
      return null;
    }
  }

  async scheduleLocalNotification(title, body, data = {}) {
    try {
      // Validate inputs
      if (!title || !body) {
        console.error('Title and body are required for notifications');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          categoryIdentifier: 'vehicle-alert',
        },
        trigger: { seconds: 1 },
      });
      
      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  async scheduleNotificationForDate(title, body, date, data = {}) {
    try {
      // Validate inputs
      if (!title || !body || !date) {
        console.error('Title, body, and date are required for scheduled notifications');
        return null;
      }

      // Ensure date is in the future
      if (new Date(date) <= new Date()) {
        console.log('Notification date is in the past, skipping:', date);
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          categoryIdentifier: 'vehicle-alert',
        },
        trigger: { date: new Date(date) },
      });
      
      console.log('Scheduled notification for date:', date, 'ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling dated notification:', error);
      return null;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      return false;
    }
  }

  async cancelNotification(notificationId) {
    try {
      if (!notificationId) {
        console.error('Notification ID required to cancel notification');
        return false;
      }
      
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Scheduled notifications count:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('Error setting badge count:', error);
      return false;
    }
  }

  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      return true;
    } catch (error) {
      console.error('Error clearing badge:', error);
      return false;
    }
  }
}

export default new NotificationService();