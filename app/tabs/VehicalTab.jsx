import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; // more reliable than base SafeAreaView

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import Colors from '../../constant/Colors';

const { width } = Dimensions.get('window');

export default function HomeTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use useFocusEffect to reload vehicles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const loadVehicles = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const vehiclesRef = db.collection('users').doc(user.uid).collection('vehicles');
      const snapshot = await vehiclesRef.orderBy('createdAt', 'desc').get();
      
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVehicles(vehiclesList);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = (id, vehicleInfo) => {
    const displayName = `${vehicleInfo.type} - ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.plate})`;
    Alert.alert(
      'Delete Vehicle', 
      `Are you sure you want to delete "${displayName}"?`, 
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVehicleFromFirebase(id),
        },
      ]
    );
  };

  const deleteVehicleFromFirebase = async (vehicleId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await db.collection('users').doc(user.uid).collection('vehicles').doc(vehicleId).delete();
      setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicleId));
      
      Alert.alert('Success', 'Vehicle deleted successfully!');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
    }
  };

  const navigateToAddVehicle = () => {
    router.push('/tabs/AddVehicle');
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return 'car-sport';
      case 'motorcycle':
      case 'bike':
        return 'bicycle';
      case 'truck':
        return 'car-outline';
      case 'bus':
        return 'bus';
      default:
        return 'car';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#F44336';
      default:
        return Colors.GRAY;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY || '#007AFF'} />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
        
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <Text style={styles.headerSubtitle}>
            {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="car-sport" size={32} color={Colors.PRIMARY || '#007AFF'} />
        </View>
      </View>

      {/* Vehicle List */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
           onPress={() => router.push(`/tabs/vehicle/${item.id}`)}
            onLongPress={() => handleDeleteVehicle(item.id, item)}
            style={styles.vehicleCard}
            activeOpacity={0.8}
          >
            {/* Vehicle Icon and Type */}
            <View style={styles.vehicleIconContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons 
                  name={getVehicleIcon(item.type)} 
                  size={32} 
                  color={Colors.PRIMARY || '#007AFF'} 
                />
              </View>
              <Text style={styles.vehicleType}>{item.type}</Text>
            </View>

            {/* Vehicle Details */}
            <View style={styles.vehicleDetails}>
              <View style={styles.vehicleMainInfo}>
                <Text style={styles.vehicleModel} numberOfLines={1}>
                  {item.brand ? `${item.brand} ${item.model}` : item.model}
                </Text>
                
                <View style={styles.plateContainer}>
                  <Ionicons name="document-text" size={16} color={Colors.GRAY} />
                  <Text style={styles.plateNumber}>{item.plate}</Text>
                </View>

                {item.manufactureYear && (
                  <View style={styles.yearContainer}>
                    <Ionicons name="calendar" size={14} color={Colors.GRAY} />
                    <Text style={styles.vehicleYear}>{item.manufactureYear}</Text>
                  </View>
                )}
              </View>

              {/* Condition Badge */}
              {item.condition && (
                <View style={[
                  styles.conditionBadge, 
                  { backgroundColor: getConditionColor(item.condition) }
                ]}>
                  <Text style={styles.conditionText}>{item.condition}</Text>
                </View>
              )}
            </View>

            {/* Arrow Icon */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color={Colors.GRAY} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="car-outline" size={100} color={Colors.GRAY_LIGHT || '#E0E0E0'} />
            </View>
            <Text style={styles.emptyTitle}>No vehicles added yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first vehicle to get started with tracking maintenance and expenses
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={navigateToAddVehicle}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.primaryButtonText}>Add Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        }
        refreshing={loading}
        onRefresh={loadVehicles}
        contentContainerStyle={vehicles.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Enhanced Floating Add Button */}
      {vehicles.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={navigateToAddVehicle}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleDetails: {
    flex: 1,
    marginRight: 12,
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  arrowContainer: {
    padding: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});