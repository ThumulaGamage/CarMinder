import { Ionicons } from '@expo/vector-icons';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebaseConfig';
import useTheme from '../../Theme/theme'; // ✅ added

const { width } = Dimensions.get('window');

export default function HomeTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const theme = useTheme(); // ✅ using theme

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
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteVehicleFromFirebase(id) },
      ]
    );
  };

  const deleteVehicleFromFirebase = async (vehicleId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await db.collection('users').doc(user.uid).collection('vehicles').doc(vehicleId).delete();
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      Alert.alert('Success', 'Vehicle deleted successfully!');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      Alert.alert('Error', 'Failed to delete vehicle.');
    }
  };

  const navigateToAddVehicle = () => {
    router.push('/tabs/AddVehicle');
  };

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

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return theme.textMuted || '#888';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border || '#ddd' }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>My Vehicles</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted || '#666' }]}>
              {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: theme.secondary }]}>
            <Ionicons name="car-sport" size={32} color={theme.icon} />
          </View>
        </View>

        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
 <TouchableOpacity
  onPress={() => {
    console.log('Navigating with vehicle ID:', item.id);
    router.push(`/tabs/vehicle/${item.id}/home`);
   
    
  }}
  onLongPress={() => handleDeleteVehicle(item.id, item)}
  style={[styles.vehicleCard, { backgroundColor: theme.card }]}
  activeOpacity={0.8}
>
              
              <View style={styles.vehicleIconContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.secondary }]}>
                  <Ionicons name={getVehicleIcon(item.type)} size={32} color={theme.icon} />
                </View>
                <Text style={[styles.vehicleType, { color: theme.textMuted }]}>{item.type}</Text>
              </View>

              <View style={styles.vehicleDetails}>
                <View style={styles.vehicleMainInfo}>
                  <Text style={[styles.vehicleModel, { color: theme.text }]}>
                    {item.brand ? `${item.brand} ${item.model}` : item.model}
                  </Text>

                  <View style={styles.plateContainer}>
                    <Ionicons name="document-text" size={16} color={theme.textMuted} />
                    <Text style={[styles.plateNumber, { backgroundColor: theme.card, color: theme.text }]}>
                      {item.plate}
                    </Text>
                  </View>

                  {item.manufactureYear && (
                    <View style={styles.yearContainer}>
                      <Ionicons name="calendar" size={14} color={theme.textMuted} />
                      <Text style={[styles.vehicleYear, { color: theme.textMuted }]}>
                        {item.manufactureYear}
                      </Text>
                    </View>
                  )}
                </View>

                {item.condition && (
                  <View style={[
                    styles.conditionBadge,
                    { backgroundColor: getConditionColor(item.condition) }
                  ]}>
                    <Text style={styles.conditionText}>{item.condition}</Text>
                  </View>
                )}
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="car-outline" size={100} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No vehicles added yet</Text>
              <Text style={[styles.emptyDescription, { color: theme.textMuted }]}>
                Add your first vehicle to get started with tracking maintenance and expenses
              </Text>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
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

        {vehicles.length > 0 && (
          <TouchableOpacity 
            style={[styles.floatingButton, { backgroundColor: theme.primary }]}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '400',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleType: {
    fontSize: 12,
    fontWeight: '600',
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
    marginLeft: 6,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

