import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import useTheme from '../../Theme/theme';

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
    case 'service': return 'construct';
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
      color: '#FF4444', 
      bgColor: '#FF444420',
      text: 'EXPIRED', 
      days: Math.abs(daysDiff),
      message: `Expired ${Math.abs(daysDiff)} days ago`
    };
  }
  if (daysDiff <= 7) {
    return { 
      status: 'critical', 
      color: '#FF6B6B', 
      bgColor: '#FF6B6B20',
      text: 'URGENT', 
      days: daysDiff,
      message: `Expires in ${daysDiff} days`
    };
  }
  if (daysDiff <= 30) {
    return { 
      status: 'warning', 
      color: '#FFA500', 
      bgColor: '#FFA50020',
      text: 'RENEWAL DUE', 
      days: daysDiff,
      message: `Expires in ${daysDiff} days`
    };
  }
  return null; // Don't show notifications for items valid for more than 30 days
};

export default function NotificationTab() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const vehicleNotifications = [];

      // Get all vehicles
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesQuery = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
        const vehicleNotifs = [];

        // Check license expiry
        try {
          const licensesRef = collection(db, 'users', user.uid, 'licenses');
          const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
          const licenseSnap = await getDocs(licenseQuery);

          if (!licenseSnap.empty) {
            const licenseData = licenseSnap.docs[0].data();
            const status = getExpiryStatus(licenseData.expireDate);
            
            if (status) {
              vehicleNotifs.push({
                id: `license-${vehicle.id}`,
                type: 'license',
                title: 'Vehicle License',
                subtitle: `License No: ${licenseData.licenseNumber || 'N/A'}`,
                status,
                expireDate: licenseData.expireDate,
                onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/licence`)
              });
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
              vehicleNotifs.push({
                id: `insurance-${vehicle.id}`,
                type: 'insurance',
                title: 'Vehicle Insurance',
                subtitle: `Policy: ${insuranceData.policyNumber || 'N/A'}`,
                status,
                expireDate: insuranceData.expireDate,
                onPress: () => router.push(`/tabs/vehicle/${vehicle.id}/licence`)
              });
            }
          }
        } catch (error) {
          console.log('No insurance data for vehicle:', vehicle.id);
        }

        // Add vehicle notifications if any exist
        if (vehicleNotifs.length > 0) {
          vehicleNotifications.push({
            vehicle,
            notifications: vehicleNotifs
          });
        }
      }

      setNotifications(vehicleNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const NotificationItem = ({ notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { 
        backgroundColor: notification.status.bgColor,
        borderLeftColor: notification.status.color
      }]}
      onPress={notification.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            <Ionicons 
              name={getNotificationIcon(notification.type)} 
              size={18} 
              color={notification.status.color} 
            />
            <Text style={[styles.notificationTitle, { color: theme.text }]}>
              {notification.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: notification.status.color }]}>
            <Text style={styles.statusText}>{notification.status.text}</Text>
          </View>
        </View>
        
        <Text style={[styles.notificationSubtitle, { color: theme.textMuted }]}>
          {notification.subtitle}
        </Text>
        
        <Text style={[styles.notificationMessage, { color: notification.status.color }]}>
          {notification.status.message}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );

  const VehicleNotificationGroup = ({ item }) => (
    <View style={[styles.vehicleGroup, { backgroundColor: theme.card }]}>
      {/* Vehicle Header */}
      <View style={styles.vehicleHeader}>
        <View style={[styles.vehicleIconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons 
            name={getVehicleIcon(item.vehicle.type)} 
            size={24} 
            color={theme.primary} 
          />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleName, { color: theme.text }]}>
            {item.vehicle.brand} {item.vehicle.model}
          </Text>
          <Text style={[styles.vehiclePlate, { color: theme.textMuted }]}>
            {item.vehicle.plate}
          </Text>
        </View>
        <View style={styles.notificationCount}>
          <Text style={[styles.countText, { color: theme.primary }]}>
            {item.notifications.length}
          </Text>
        </View>
      </View>

      {/* Notifications List */}
      <View style={styles.notificationsList}>
        {item.notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading notifications...
          </Text>
        </View>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Ionicons name="notifications-off" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Notifications
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            All your vehicle documents are up to date!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Vehicle Notifications
        </Text>
        <TouchableOpacity onPress={loadNotifications}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.vehicle.id}
        renderItem={({ item }) => <VehicleNotificationGroup item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  vehicleGroup: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  vehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 14,
  },
  notificationCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  notificationSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
});