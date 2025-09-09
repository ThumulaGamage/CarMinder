import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../Theme/theme';
import { auth, db } from '../../config/firebaseConfig';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationTab() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('overdue');
  const [notifications, setNotifications] = useState({
    overdue: [],
    dueSoon: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotificationData();
    }, [])
  );

  const initializeNotifications = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications to receive service reminders.');
        return;
      }

      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  };

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      console.log('Fetching notification data for user:', userId);

      // Fetch all vehicles for the user
      const vehiclesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('vehicles')
        .get();

      const allNotifications = {
        overdue: [],
        dueSoon: [],
        completed: []
      };

      vehiclesSnapshot.forEach(doc => {
        const vehicleData = { id: doc.id, ...doc.data() };
        console.log('Processing vehicle:', vehicleData);
        const vehicleNotifications = calculateServiceNotifications(vehicleData);
        
        allNotifications.overdue.push(...vehicleNotifications.overdue);
        allNotifications.dueSoon.push(...vehicleNotifications.dueSoon);
        allNotifications.completed.push(...vehicleNotifications.completed);
      });

      console.log('Calculated notifications:', allNotifications);
      setNotifications(allNotifications);
      
      // Schedule notifications for overdue services
      if (allNotifications.overdue.length > 0) {
        await scheduleNotifications(allNotifications.overdue);
      }

    } catch (error) {
      console.error('Error fetching notification data:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateServiceNotifications = (vehicle) => {
    const currentDate = new Date();
    const currentMileage = Number(vehicle.mileage) || 0;
    const notifications = { overdue: [], dueSoon: [], completed: [] };

    console.log(`Calculating for vehicle: ${vehicle.brand} ${vehicle.model}, Current mileage: ${currentMileage}`);

    // Define service intervals
    const services = [
      {
        type: 'Oil Service',
        lastMileage: Number(vehicle.oilServiceMileage) || 0,
        interval: 5000,
        icon: 'water-outline',
        color: '#E74C3C'
      },
      {
        type: 'Full Service',
        lastMileage: Number(vehicle.fullServiceMileage) || 0,
        interval: 10000,
        icon: 'construct-outline',
        color: '#4ECDC4'
      },
      {
        type: 'Tyre Change',
        lastMileage: Number(vehicle.tyreChangeMileage) || 0,
        interval: 40000,
        icon: 'ellipse-outline',
        color: '#45B7D1'
      }
    ];

    const dateServices = [
      {
        type: 'Brake Oil',
        lastDate: vehicle.brakeOilDate ? new Date(vehicle.brakeOilDate) : null,
        intervalMonths: 24,
        icon: 'disc-outline',
        color: '#F39C12'
      },
      {
        type: 'Battery Check',
        lastDate: vehicle.batteryCheckDate ? new Date(vehicle.batteryCheckDate) : null,
        intervalMonths: 6,
        icon: 'battery-charging-outline',
        color: '#9B59B6'
      }
    ];

    // Check mileage-based services
    services.forEach(service => {
      const nextDueMileage = Number(service.lastMileage) + service.interval;
      const remainingMileage = nextDueMileage - currentMileage;
      
      console.log(`${service.type}: Last ${service.lastMileage}, Next ${nextDueMileage}, Remaining ${remainingMileage}`);
      
      if (remainingMileage <= 0) {
        // Overdue
        const daysOverdue = Math.ceil(Math.abs(remainingMileage) / 50); // Rough estimate: 50km per day
        notifications.overdue.push({
          id: `${vehicle.id}_${service.type}`,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          serviceType: service.type,
          daysOverdue: daysOverdue,
          lastService: service.lastMileage,
          nextDue: nextDueMileage,
          priority: Math.abs(remainingMileage) > 2000 ? 'critical' : 'high',
          icon: service.icon,
          notificationType: 'mileage'
        });
      } else if (remainingMileage <= 1000) {
        // Due soon
        const daysUntilDue = Math.ceil(remainingMileage / 50);
        notifications.dueSoon.push({
          id: `${vehicle.id}_${service.type}`,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          serviceType: service.type,
          daysUntilDue: daysUntilDue,
          lastService: service.lastMileage,
          nextDue: nextDueMileage,
          priority: 'medium',
          icon: service.icon,
          notificationType: 'mileage'
        });
      }
    });

    // Check date-based services
    dateServices.forEach(service => {
      if (!service.lastDate) return;
      
      const nextDueDate = new Date(service.lastDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + service.intervalMonths);
      
      const timeDiff = nextDueDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      console.log(`${service.type}: Last ${service.lastDate.toLocaleDateString()}, Next ${nextDueDate.toLocaleDateString()}, Days ${daysDiff}`);
      
      if (daysDiff <= 0) {
        // Overdue
        notifications.overdue.push({
          id: `${vehicle.id}_${service.type}`,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          serviceType: service.type,
          daysOverdue: Math.abs(daysDiff),
          lastService: service.lastDate.toLocaleDateString(),
          nextDue: nextDueDate.toLocaleDateString(),
          priority: Math.abs(daysDiff) > 30 ? 'critical' : 'high',
          icon: service.icon,
          notificationType: 'date'
        });
      } else if (daysDiff <= 30) {
        // Due soon
        notifications.dueSoon.push({
          id: `${vehicle.id}_${service.type}`,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          serviceType: service.type,
          daysUntilDue: daysDiff,
          lastService: service.lastDate.toLocaleDateString(),
          nextDue: nextDueDate.toLocaleDateString(),
          priority: 'medium',
          icon: service.icon,
          notificationType: 'date'
        });
      }
    });

    return notifications;
  };

  const scheduleNotifications = async (overdueNotifications) => {
    try {
      console.log('Scheduling notifications for', overdueNotifications.length, 'overdue services');
      
      // Schedule immediate notification
      if (overdueNotifications.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vehicle Service Reminder',
            body: `You have ${overdueNotifications.length} overdue service(s). Check your notifications tab.`,
            data: {
              type: 'service_reminder',
              count: overdueNotifications.length
            },
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }

      // Schedule daily reminders
      for (const notification of overdueNotifications.slice(0, 3)) { // Limit to 3 to avoid spam
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${notification.serviceType} Overdue`,
            body: `${notification.vehicleName} needs ${notification.serviceType}. ${notification.daysOverdue} days overdue.`,
            data: {
              vehicleId: notification.vehicleId,
              serviceType: notification.serviceType,
              notificationId: notification.id
            },
            sound: true,
          },
          trigger: {
            hour: 9,
            minute: 0,
            repeats: true,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotificationData();
    setRefreshing(false);
  }, []);

  const getServiceIconColor = (iconType) => {
    switch (iconType) {
      case 'water-outline': return '#E74C3C';
      case 'construct-outline': return '#4ECDC4';
      case 'disc-outline': return '#F39C12';
      case 'battery-charging-outline': return '#9B59B6';
      case 'ellipse-outline': return '#45B7D1';
      default: return '#6B7280';
    }
  };

  const getPriorityColors = (priority) => {
    switch (priority) {
      case 'critical': return { bg: '#FFEBEE', border: '#F44336', text: '#C62828' };
      case 'high': return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' };
      case 'medium': return { bg: '#FFFDE7', border: '#FFEB3B', text: '#F57F17' };
      case 'completed': return { bg: '#E8F5E8', border: '#4CAF50', text: '#2E7D32' };
      default: return { bg: '#F5F5F5', border: '#9E9E9E', text: '#424242' };
    }
  };

  const handleMarkDone = async (notification) => {
    Alert.alert(
      'Mark Service Complete',
      `Mark ${notification.serviceType} for ${notification.vehicleName} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Done', 
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              const updateData = {};
              const currentDate = new Date().toISOString();
              
              // Get current vehicle data to update mileage
              const vehicleDoc = await db
                .collection('users')
                .doc(userId)
                .collection('vehicles')
                .doc(notification.vehicleId)
                .get();
              
              const vehicleData = vehicleDoc.data();
              const currentMileage = Number(vehicleData?.mileage) || 0;

              // Update based on service type
              switch (notification.serviceType) {
                case 'Oil Service':
                  updateData.oilServiceMileage = currentMileage;
                  updateData.lastOilServiceDate = currentDate;
                  break;
                case 'Full Service':
                  updateData.fullServiceMileage = currentMileage;
                  updateData.lastFullServiceDate = currentDate;
                  break;
                case 'Tyre Change':
                  updateData.tyreChangeMileage = currentMileage;
                  updateData.lastTyreChangeDate = currentDate;
                  break;
                case 'Brake Oil':
                  updateData.brakeOilDate = currentDate;
                  break;
                case 'Battery Check':
                  updateData.batteryCheckDate = currentDate;
                  break;
              }

              console.log('Updating vehicle with data:', updateData);

              await db
                .collection('users')
                .doc(userId)
                .collection('vehicles')
                .doc(notification.vehicleId)
                .update(updateData);

              Alert.alert('Success', `${notification.serviceType} marked as completed!`);
              fetchNotificationData(); // Refresh data
            } catch (error) {
              console.error('Error marking service as done:', error);
              Alert.alert('Error', 'Failed to update service. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSnooze = (notification) => {
    Alert.alert(
      'Snooze Notification',
      'Snooze this notification for how long?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 Day', onPress: () => Alert.alert('Snoozed for 1 day') },
        { text: '3 Days', onPress: () => Alert.alert('Snoozed for 3 days') },
        { text: '1 Week', onPress: () => Alert.alert('Snoozed for 1 week') }
      ]
    );
  };

  const renderNotificationCard = (notification, isOverdue = false) => {
    const colors = getPriorityColors(notification.priority);
    
    return (
      <View key={notification.id} style={[styles.notificationCard, { borderLeftColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, { backgroundColor: getServiceIconColor(notification.icon) + '20' }]}>
              <Ionicons 
                name={notification.icon} 
                size={20} 
                color={getServiceIconColor(notification.icon)} 
              />
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.vehicleName}>{notification.vehicleName}</Text>
              <Text style={styles.serviceType}>{notification.serviceType}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton}>
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.border + '20' }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {notification.priority === 'completed' 
                  ? 'Completed'
                  : isOverdue 
                    ? `${notification.daysOverdue} days overdue`
                    : `Due in ${notification.daysUntilDue} days`
                }
              </Text>
            </View>
            <Text style={styles.dateText}>
              {notification.priority === 'completed'
                ? `Completed: ${new Date(notification.completedDate).toLocaleDateString()}`
                : isOverdue
                  ? `Last: ${notification.lastService}`
                  : `Due: ${notification.nextDue}`
              }
            </Text>
          </View>

          {notification.priority !== 'completed' && (
            <View style={styles.actionButtons}>
              {isOverdue ? (
                <>
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => handleMarkDone(notification)}
                  >
                    <Text style={styles.primaryButtonText}>Mark as Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => handleSnooze(notification)}
                  >
                    <Text style={styles.secondaryButtonText}>Snooze</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.fullButton}>
                  <Text style={styles.fullButtonText}>Set Reminder</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={64} color="#3B82F6" />
      <Text style={styles.emptyTitle}>All services are up to date!</Text>
      <Text style={styles.emptySubtitle}>No {activeTab} services found</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: '#3B82F6',
      paddingBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      flex: 1,
      textAlign: 'center',
    },
    notificationBadge: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginHorizontal: 20,
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: 'white',
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
    },
    activeTabText: {
      color: '#3B82F6',
    },
    inactiveTabText: {
      color: 'rgba(255,255,255,0.8)',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    notificationCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cardHeader: {
      marginBottom: 12,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    titleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 2,
    },
    serviceType: {
      fontSize: 14,
      color: '#6B7280',
    },
    closeButton: {
      padding: 4,
    },
    cardContent: {
      gap: 12,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    dateText: {
      fontSize: 12,
      color: '#6B7280',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: '#3B82F6',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },
    fullButton: {
      backgroundColor: '#F3F4F6',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
    },
    fullButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
    },
    summaryContainer: {
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryNumber: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Service Notifications</Text>
          <View style={styles.notificationBadge}>
            <Ionicons name="notifications" size={24} color="white" />
            {notifications.overdue.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications.overdue.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overdue' && styles.activeTab]}
            onPress={() => setActiveTab('overdue')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'overdue' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              Overdue ({notifications.overdue.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dueSoon' && styles.activeTab]}
            onPress={() => setActiveTab('dueSoon')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'dueSoon' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              Due Soon ({notifications.dueSoon.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'completed' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading notifications...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overdue' && (
              notifications.overdue.length === 0 
                ? renderEmptyState()
                : notifications.overdue.map(notification => renderNotificationCard(notification, true))
            )}

            {activeTab === 'dueSoon' && (
              notifications.dueSoon.length === 0
                ? renderEmptyState()
                : notifications.dueSoon.map(notification => renderNotificationCard(notification, false))
            )}

            {activeTab === 'completed' && (
              notifications.completed.length === 0
                ? renderEmptyState()
                : notifications.completed.map(notification => renderNotificationCard(notification, false))
            )}
          </>
        )}
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>
              {notifications.overdue.length}
            </Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>
              {notifications.dueSoon.length}
            </Text>
            <Text style={styles.summaryLabel}>Due Soon</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
              {notifications.completed.length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}