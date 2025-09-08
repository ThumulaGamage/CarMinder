import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  View
} from 'react-native';
import useTheme from '../../../../Theme/theme';
import ThemedText from '../../../../components/ThemedText';
import ThemedView from '../../../../components/ThemedView';

export default function NotificationScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate loading notifications for this vehicle
    // In real app, you'd fetch from storage/database
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // Sample notifications - in real app, get from AsyncStorage or database
    const sampleNotifications = [
      {
        id: 1,
        type: 'license_expiry',
        title: 'License Expiring Soon',
        message: 'Your driving license expires in 15 days',
        date: new Date().toISOString(),
        priority: 'high',
        read: false
      },
      {
        id: 2,
        type: 'reminder',
        title: 'License Renewal Reminder',
        message: 'Consider renewing your license before expiration',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        priority: 'medium',
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'License Information Updated',
        message: 'License details have been successfully saved',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        priority: 'low',
        read: true
      }
    ];

    setNotifications(sampleNotifications);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotification = (notificationId) => {
    Alert.alert(
      'Clear Notification',
      'Are you sure you want to remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            setNotifications(prev =>
              prev.filter(notification => notification.id !== notificationId)
            );
          }
        }
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF4444';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return theme.textSecondary;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'license_expiry': return '⚠️';
      case 'reminder': return '🔔';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Notifications
        </ThemedText>
        <ThemedText style={[styles.vehicleId, { color: theme.textSecondary }]}>
          Vehicle {id}
        </ThemedText>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#FF4444' }]}>
            <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <TouchableOpacity
          style={[styles.clearAllButton, { borderColor: theme.border }]}
          onPress={clearAllNotifications}
        >
          <ThemedText style={[styles.clearAllText, { color: theme.textSecondary }]}>
            Clear All Notifications
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <ThemedView style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.emptyIcon, { color: theme.textSecondary }]}>
            🔔
          </ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            No Notifications
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            You're all caught up! License reminders and alerts will appear here.
          </ThemedText>
        </ThemedView>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: notification.read ? 'transparent' : getPriorityColor(notification.priority),
                opacity: notification.read ? 0.7 : 1
              }
            ]}
            onPress={() => markAsRead(notification.id)}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationTitleRow}>
                  <ThemedText style={styles.typeIcon}>
                    {getTypeIcon(notification.type)}
                  </ThemedText>
                  <ThemedText style={[styles.notificationTitle, { color: theme.text }]}>
                    {notification.title}
                  </ThemedText>
                  {!notification.read && (
                    <View style={[styles.unreadDot, { backgroundColor: getPriorityColor(notification.priority) }]} />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearNotification(notification.id)}
                >
                  <ThemedText style={[styles.clearButtonText, { color: theme.textSecondary }]}>
                    ✕
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={[styles.notificationMessage, { color: theme.textSecondary }]}>
                {notification.message}
              </ThemedText>

              <ThemedText style={[styles.notificationDate, { color: theme.textSecondary }]}>
                {formatDate(notification.date)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Quick Actions */}
      <ThemedView style={[styles.quickActions, { backgroundColor: theme.cardBackground }]}>
        <ThemedText style={[styles.quickActionsTitle, { color: theme.text }]}>
          Quick Actions
        </ThemedText>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Reminder Set', 'License renewal reminder has been set')}
        >
          <ThemedText style={styles.actionButtonText}>
            🔔 Set License Reminder
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
          onPress={() => Alert.alert('Info', 'This will check all your license expiry dates')}
        >
          <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
            🔍 Check All License Status
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleId: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 15,
    right: 20,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  clearAllText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
  },
  quickActions: {
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});