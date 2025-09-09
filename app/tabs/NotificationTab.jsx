import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../config/firebaseConfig';
import useTheme from '../../Theme/theme';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getVehicleIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'car': return 'car-sport';
    case 'motorcycle':
    case 'bike': return 'bicycle';
    case 'truck': return 'car-outline';
    case 'bus': return 'bus';
    default: return 'car';
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'license': return 'card';
    case 'insurance': return 'shield-checkmark';
    case 'oil_service': return 'water-outline';
    case 'full_service': return 'construct-outline';
    case 'tyre_change': return 'ellipse-outline';
    case 'brake_oil': return 'disc-outline';
    case 'battery_check': return 'battery-charging-outline';
    default: return 'notifications';
  }
};

const getExpiryStatus = (expireDate) => {
  if (!expireDate) return null;
  
  const today = new Date();
  const expiry = new Date(expireDate);
  const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return { 
      status: 'expired', 
      priority: 'critical',
      color: '#FF4444', 
      bgColor: '#FF444420',
      text: 'EXPIRED', 
      days: Math.abs(daysDiff),
      message: `Expired ${Math.abs(daysDiff)} days ago`,
      daysOverdue: Math.abs(daysDiff)
    };
  }
  if (daysDiff <= 7) {
    return { 
      status: 'critical', 
      priority: 'high',
      color: '#FF6B6B', 
      bgColor: '#FF6B6B20',
      text: 'URGENT', 
      days: daysDiff,
      message: `Expires in ${daysDiff} days`,
      daysUntilDue: daysDiff
    };
  }
  if (daysDiff <= 30) {
    return { 
      status: 'warning', 
      priority: 'medium',
      color: '#FFA500', 
      bgColor: '#FFA50020',
      text: 'RENEWAL DUE', 
      days: daysDiff,
      message: `Expires in ${daysDiff} days`,
      daysUntilDue: daysDiff
    };
  }
  return null;
};

const getServiceStatus = (daysOverdue, daysUntilDue, isOverdue) => {
  if (isOverdue) {
    if (daysOverdue > 30) {
      return {
        status: 'critical',
        priority: 'critical',
        color: '#FF4444',
        bgColor: '#FF444420',
        text: 'CRITICAL',
        message: `${daysOverdue} days overdue`,
        daysOverdue
      };
    } else {
      return {
        status: 'overdue',
        priority: 'high',
        color: '#FF6B6B',
        bgColor: '#FF6B6B20',
        text: 'OVERDUE',
        message: `${daysOverdue} days overdue`,
        daysOverdue
      };
    }
  } else {
    return {
      status: 'due_soon',
      priority: 'medium',
      color: '#FFA500',
      bgColor: '#FFA50020',
      text: 'DUE SOON',
      message: `Due in ${daysUntilDue} days`,
      daysUntilDue
    };
  }
};

export default function NotificationTab() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overdue');
  const [notifications, setNotifications] = useState({
    overdue: [],
    dueSoon: [],
    completed: []
  });

  // Initialize push notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const allNotifications = {
        overdue: [],
        dueSoon: [],
        completed: []
      };

      // Get all vehicles
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesQuery = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

        // ===== DOCUMENT NOTIFICATIONS =====
        
        // Check license expiry
        try {
          const licensesRef = collection(db, 'users', user.uid, 'licenses');
          const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
          const licenseSnap = await getDocs(licenseQuery);

          if (!licenseSnap.empty) {
            const licenseData = licenseSnap.docs[0].data();
            const status = getExpiryStatus(licenseData.expireDate);
            
            if (status) {
              const notification = {
                id: `license-${vehicle.id}`,
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.brand} ${vehicle.model}`,
                type: 'license',
                category: 'document',
                title: 'Vehicle License',
                serviceType: 'Vehicle License',
                subtitle: `License No: ${licenseData.licenseNumber || 'N/A'}`,
                status,
                priority: status.priority,
                expireDate: licenseData.expireDate,
                icon: 'card',
                notificationType: 'document',
                lastService: licenseData.issueDate || 'N/A',
                nextDue: licenseData.expireDate,
                daysOverdue: status.daysOverdue || 0,
                daysUntilDue: status.daysUntilDue || 0,
                onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/Vehicle Documents?tab=license`)
              };

              // Categorize based on status
              if (status.status === 'expired' || status.status === 'critical') {
                allNotifications.overdue.push(notification);
              } else if (status.status === 'warning') {
                allNotifications.dueSoon.push(notification);
              }
            }
          }
        } catch (error) {
          console.log('No license data for vehicle:', vehicle.id);
        }

        // Check insurance expiry
        try {
          const insuranceRef = collection(db, 'users', user.uid, 'insurance');
          const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicle.id));
          const insuranceSnap = await getDocs(insuranceQuery);

          if (!insuranceSnap.empty) {
            const insuranceData = insuranceSnap.docs[0].data();
            const status = getExpiryStatus(insuranceData.expireDate);
            
            if (status) {
              const notification = {
                id: `insurance-${vehicle.id}`,
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.brand} ${vehicle.model}`,
                type: 'insurance',
                category: 'document',
                title: 'Vehicle Insurance',
                serviceType: 'Vehicle Insurance',
                subtitle: `Policy: ${insuranceData.policyNumber || 'N/A'}`,
                status,
                priority: status.priority,
                expireDate: insuranceData.expireDate,
                icon: 'shield-checkmark',
                notificationType: 'document',
                lastService: insuranceData.issueDate || 'N/A',
                nextDue: insuranceData.expireDate,
                daysOverdue: status.daysOverdue || 0,
                daysUntilDue: status.daysUntilDue || 0,
                onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/Vehicle Documents?tab=insurance`)
              };

              // Categorize based on status
              if (status.status === 'expired' || status.status === 'critical') {
                allNotifications.overdue.push(notification);
              } else if (status.status === 'warning') {
                allNotifications.dueSoon.push(notification);
              }
            }
          }
        } catch (error) {
          console.log('No insurance data for vehicle:', vehicle.id);
        }

        // ===== SERVICE NOTIFICATIONS =====
        
        const currentMileage = Number(vehicle.mileage) || 0;

        // Define service intervals
        const services = [
          {
            type: 'Oil Service',
            field: 'oilServiceMileage',
            lastMileage: Number(vehicle.oilServiceMileage) || 0,
            interval: 5000,
            icon: 'water-outline',
          },
          {
            type: 'Full Service',
            field: 'fullServiceMileage',
            lastMileage: Number(vehicle.fullServiceMileage) || 0,
            interval: 10000,
            icon: 'construct-outline',
          },
          {
            type: 'Tyre Change',
            field: 'tyreChangeMileage',
            lastMileage: Number(vehicle.tyreChangeMileage) || 0,
            interval: 40000,
            icon: 'ellipse-outline',
          }
        ];

        // Check mileage-based services
        services.forEach(service => {
          const nextDueMileage = service.lastMileage + service.interval;
          const remainingMileage = nextDueMileage - currentMileage;
          
          if (remainingMileage <= 1000) { // Show if due within 1000km or overdue
            const isOverdue = remainingMileage <= 0;
            const daysOverdue = isOverdue ? Math.ceil(Math.abs(remainingMileage) / 50) : 0;
            const daysUntilDue = !isOverdue ? Math.ceil(remainingMileage / 50) : 0;
            
            const status = getServiceStatus(daysOverdue, daysUntilDue, isOverdue);
            
            const notification = {
              id: `${vehicle.id}_${service.type}`,
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.brand} ${vehicle.model}`,
              type: service.type.toLowerCase().replace(' ', '_'),
              category: 'service',
              title: service.type,
              serviceType: service.type,
              subtitle: `Last: ${service.lastMileage} km | Next: ${nextDueMileage} km`,
              status,
              priority: status.priority,
              isOverdue,
              icon: service.icon,
              notificationType: 'mileage',
              lastService: service.lastMileage,
              nextDue: nextDueMileage,
              daysOverdue: status.daysOverdue || 0,
              daysUntilDue: status.daysUntilDue || 0,
              serviceField: service.field,
              onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/service_records/service_ongoing`)
            };

            // Categorize
            if (isOverdue) {
              allNotifications.overdue.push(notification);
            } else {
              allNotifications.dueSoon.push(notification);
            }
          }
        });

        // Check date-based services
        const dateServices = [
          {
            type: 'Brake Oil',
            field: 'brakeOilDate',
            lastDate: vehicle.brakeOilDate ? new Date(vehicle.brakeOilDate) : null,
            intervalMonths: 24,
            icon: 'disc-outline',
          },
          {
            type: 'Battery Check',
            field: 'batteryCheckDate',
            lastDate: vehicle.batteryCheckDate ? new Date(vehicle.batteryCheckDate) : null,
            intervalMonths: 6,
            icon: 'battery-charging-outline',
          }
        ];

        dateServices.forEach(service => {
          if (!service.lastDate) return;
          
          const nextDueDate = new Date(service.lastDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + service.intervalMonths);
          
          const currentDate = new Date();
          const timeDiff = nextDueDate.getTime() - currentDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff <= 30) { // Show if due within 30 days or overdue
            const isOverdue = daysDiff <= 0;
            const daysOverdue = isOverdue ? Math.abs(daysDiff) : 0;
            const daysUntilDue = !isOverdue ? daysDiff : 0;
            
            const status = getServiceStatus(daysOverdue, daysUntilDue, isOverdue);
            
            const notification = {
              id: `${vehicle.id}_${service.type}`,
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.brand} ${vehicle.model}`,
              type: service.type.toLowerCase().replace(' ', '_'),
              category: 'service',
              title: service.type,
              serviceType: service.type,
              subtitle: `Last: ${service.lastDate.toLocaleDateString()} | Next: ${nextDueDate.toLocaleDateString()}`,
              status,
              priority: status.priority,
              isOverdue,
              icon: service.icon,
              notificationType: 'date',
              lastService: service.lastDate.toLocaleDateString(),
              nextDue: nextDueDate.toLocaleDateString(),
              daysOverdue: status.daysOverdue || 0,
              daysUntilDue: status.daysUntilDue || 0,
              serviceField: service.field,
              onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/service_records/service_ongoing`)
            };

            // Categorize
            if (isOverdue) {
              allNotifications.overdue.push(notification);
            } else {
              allNotifications.dueSoon.push(notification);
            }
          }
        });
      }

      setNotifications(allNotifications);

      // Schedule push notifications for critical items
      const criticalCount = allNotifications.overdue.length;
      if (criticalCount > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vehicle Alert',
            body: `You have ${criticalCount} critical notification(s) requiring attention.`,
            data: { type: 'critical_notifications', count: criticalCount },
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleMarkDone = async (notification) => {
    Alert.alert(
      'Mark as Complete',
      `Mark ${notification.serviceType} for ${notification.vehicleName} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Done', 
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              const vehicleDocRef = doc(db, 'users', userId, 'vehicles', notification.vehicleId);
              const updateData = {};
              const currentDate = new Date().toISOString();

              if (notification.category === 'service') {
                // Get current vehicle data for mileage-based services
                const vehicleSnapshot = await getDocs(query(
                  collection(db, 'users', userId, 'vehicles'),
                  where('__name__', '==', notification.vehicleId)
                ));
                
                if (!vehicleSnapshot.empty) {
                  const vehicleData = vehicleSnapshot.docs[0].data();
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
                }
              } else if (notification.category === 'document') {
                // For documents, we might want to extend the expiry date
                // This is just a placeholder - you might want different logic
                if (notification.serviceType === 'Vehicle License') {
                  // Extend license by 1 year from current expiry
                  const currentExpiry = new Date(notification.expireDate);
                  const newExpiry = new Date(currentExpiry.setFullYear(currentExpiry.getFullYear() + 1));
                  
                  // Update the license document
                  const licenseQuery = query(
                    collection(db, 'users', userId, 'licenses'),
                    where('vehicleId', '==', notification.vehicleId)
                  );
                  const licenseSnapshot = await getDocs(licenseQuery);
                  
                  if (!licenseSnapshot.empty) {
                    const licenseDocRef = doc(db, 'users', userId, 'licenses', licenseSnapshot.docs[0].id);
                    await updateDoc(licenseDocRef, {
                      expireDate: newExpiry.toISOString().split('T')[0],
                      renewedDate: currentDate
                    });
                  }
                } else if (notification.serviceType === 'Vehicle Insurance') {
                  // Extend insurance by 1 year from current expiry
                  const currentExpiry = new Date(notification.expireDate);
                  const newExpiry = new Date(currentExpiry.setFullYear(currentExpiry.getFullYear() + 1));
                  
                  // Update the insurance document
                  const insuranceQuery = query(
                    collection(db, 'users', userId, 'insurance'),
                    where('vehicleId', '==', notification.vehicleId)
                  );
                  const insuranceSnapshot = await getDocs(insuranceQuery);
                  
                  if (!insuranceSnapshot.empty) {
                    const insuranceDocRef = doc(db, 'users', userId, 'insurance', insuranceSnapshot.docs[0].id);
                    await updateDoc(insuranceDocRef, {
                      expireDate: newExpiry.toISOString().split('T')[0],
                      renewedDate: currentDate
                    });
                  }
                }
              }

              // Update vehicle if there's vehicle-level data to update
              if (Object.keys(updateData).length > 0) {
                await updateDoc(vehicleDocRef, updateData);
              }

              Alert.alert('Success', `${notification.serviceType} marked as completed!`);
              
              // Auto refresh the notifications
              await loadNotifications();
              
            } catch (error) {
              console.error('Error marking as done:', error);
              Alert.alert('Error', 'Failed to update. Please try again.');
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
        { text: '1 Day', onPress: () => Alert.alert('Snoozed', `${notification.serviceType} snoozed for 1 day`) },
        { text: '3 Days', onPress: () => Alert.alert('Snoozed', `${notification.serviceType} snoozed for 3 days`) },
        { text: '1 Week', onPress: () => Alert.alert('Snoozed', `${notification.serviceType} snoozed for 1 week`) }
      ]
    );
  };

  // Auto-refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
  }, []);

  const getPriorityColors = (priority) => {
    switch (priority) {
      case 'critical': return { bg: '#FFEBEE', border: '#F44336', text: '#C62828' };
      case 'high': return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' };
      case 'medium': return { bg: '#FFFDE7', border: '#FFEB3B', text: '#F57F17' };
      default: return { bg: '#F5F5F5', border: '#9E9E9E', text: '#424242' };
    }
  };

  const getServiceIconColor = (iconType) => {
    switch (iconType) {
      case 'water-outline': return '#E74C3C';
      case 'construct-outline': return '#4ECDC4';
      case 'disc-outline': return '#F39C12';
      case 'battery-charging-outline': return '#9B59B6';
      case 'ellipse-outline': return '#45B7D1';
      case 'card': return '#3B82F6';
      case 'shield-checkmark': return '#10B981';
      default: return '#6B7280';
    }
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
            {notification.category === 'document' && (
              <View style={[styles.categoryBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.categoryText}>DOC</Text>
              </View>
            )}
            {notification.category === 'service' && (
              <View style={[styles.categoryBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.categoryText}>SVC</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.border + '20' }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {isOverdue 
                  ? `${notification.daysOverdue} days overdue`
                  : `Due in ${notification.daysUntilDue} days`
                }
              </Text>
            </View>
            <Text style={styles.dateText}>
              {isOverdue
                ? `Last: ${notification.lastService}`
                : `Due: ${notification.nextDue}`
              }
            </Text>
          </View>

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
              <TouchableOpacity 
                style={styles.fullButton}
                onPress={() => handleSnooze(notification)}
              >
                <Text style={styles.fullButtonText}>Set Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={64} color={theme.primary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>All up to date!</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        No {activeTab === 'overdue' ? 'overdue' : activeTab === 'dueSoon' ? 'due soon' : 'recent'} notifications
      </Text>
    </View>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading notifications...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const totalOverdue = notifications.overdue.length;
  const totalDueSoon = notifications.dueSoon.length;
  const totalCompleted = notifications.completed.length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications" size={24} color="white" />
              {totalOverdue > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalOverdue > 99 ? '99+' : totalOverdue}
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
                Overdue ({totalOverdue})
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
                Due Soon ({totalDueSoon})
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
        </ScrollView>

        {/* Summary Stats */}
        <View style={[styles.summaryContainer, { backgroundColor: theme.card }]}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>
                {totalOverdue}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Overdue</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>
                {totalDueSoon}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Due Soon</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
                {totalCompleted}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Completed</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  summaryContainer: {
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
  },
});