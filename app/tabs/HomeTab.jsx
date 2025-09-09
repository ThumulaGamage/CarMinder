import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image, // Added Image import
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebaseConfig';
import useTheme from '../../Theme/theme';

const { width } = Dimensions.get('window');

export default function HomeTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ 
    name: '', 
    email: '', 
    profilePicture: null // Added profile picture state
  });
  const router = useRouter();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
      loadUserInfo();
    }, [])
  );

  const loadUserInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user info from Firebase Auth
      const userEmail = user.email || '';
      let userName = user.displayName || '';
      let profilePicture = null;

      // Try to get user details from Firestore
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData.name || userData.displayName || userName;
          profilePicture = userData.profilePicture || null; // Get profile picture
        }
      } catch (error) {
        console.log('No user document found, using email');
      }

      // If still no name, extract from email
      if (!userName && userEmail) {
        userName = userEmail.split('@')[0];
      }

      setUserInfo({ 
        name: userName, 
        email: userEmail, 
        profilePicture: profilePicture 
      });
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/auth/login'); // Navigate to login screen
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Updated UserAvatar component to handle profile picture
  const UserAvatar = () => {
    if (userInfo.profilePicture) {
      return (
        <Image 
          source={{ uri: userInfo.profilePicture }} 
          style={styles.userAvatarImage}
          onError={() => {
            // If image fails to load, fall back to initials
            setUserInfo(prev => ({ ...prev, profilePicture: null }));
          }}
        />
      );
    }

    return (
      <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
        <Text style={styles.userInitials}>{getInitials(userInfo.name)}</Text>
      </View>
    );
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
        {/* User Header with Profile Picture */}
        <View style={[styles.userHeader, { backgroundColor: theme.card2 }]}>
          <View style={styles.userInfo}>
            <UserAvatar />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.text2 }]}>
                {userInfo.name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.text2 }]}>
                {userInfo.email}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={50} color='#D32F2F' />
          </TouchableOpacity>
        </View>

        {/* Vehicle Header */}
        <View style={[styles.header, { backgroundColor: theme.card3, borderBottomColor: theme.border || '#ddd' }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.text3 }]}>My Vehicles</Text>
            <Text style={[styles.headerSubtitle, { color: theme.text3 || '#666' }]}>
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
                router.push(`/tabs/vehicle/${item.id}/Vehicle Details`);
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

   userAvatarImage: {
    width: 80,
    height: 80,
    borderRadius:50,
    backgroundColor: '#f0f0f0', 
    marginRight:10// fallback background color
  },
  
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 0,
    marginHorizontal: 16,
    marginTop: 8,
    marginLeft:0,
    marginRight:0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  userAvatar: {
    width: 30,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },

  userEmail: {
    fontSize: 14,
  },

  signOutButton: {
    padding: 8,
    borderRadius: 8,
  },

 loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    marginLeft:10,
    marginRight:10,
    borderRadius: 5,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
  },

  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  vehicleIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },

  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  vehicleType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  vehicleDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vehicleMainInfo: {
    flex: 1,
  },

  vehicleModel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  plateNumber: {
    fontSize: 14,
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },

  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  vehicleYear: {
    fontSize: 12,
    marginLeft: 4,
  },

  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },

  arrowContainer: {
    marginLeft: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },

  emptyIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});