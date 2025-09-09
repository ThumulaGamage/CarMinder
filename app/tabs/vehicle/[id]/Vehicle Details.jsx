import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../../../config/firebaseConfig';
import useTheme from '../../../../Theme/theme';

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

const VehicleDetailScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const selectedVehicleId = params.id;

  useEffect(() => {
    if (!selectedVehicleId) {
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoading(false);
          return;
        }

        const vehicleDocRef = doc(db, 'users', userId, 'vehicles', selectedVehicleId);
        const docSnap = await getDoc(vehicleDocRef);

        if (docSnap.exists()) {
          setVehicle({ id: docSnap.id, ...docSnap.data() });
        } else {
          setVehicle(null);
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [selectedVehicleId]);

  const handleEdit = () => {
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/options/edit_specifications',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleUpdateMileage = () => {
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/options/mileage_update',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleAddSpecs = () => {
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/service_records/service_ongoing',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleServiceRecords = () => {
    console.log('Navigating to Service Records with vehicle ID:', vehicle.id);
    // Connected to service_ongoing as requested
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/service_records/service_ongoing',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleDocuments = () => {
    console.log('Navigating to Documents with vehicle ID:', vehicle.id);
    router.push(`/tabs/vehicle/${vehicle.id}/Vehicle Documents`);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedVehicleId || !vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle" size={64} color={theme.textMuted} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {!selectedVehicleId ? 'No vehicle selected.' : 'Vehicle not found.'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    

      
      {/* Vehicle Image/Icon Section */}
      <LinearGradient
        colors={[theme.primary + '20', theme.background]}
        style={styles.vehicleHeader}
      >
        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={() => router.push('../../../homepage')} style={styles.headerButton}>
  <Ionicons name="home" size={24} color='#FFFFFF' />
</TouchableOpacity>
                            <Text style={[styles.headerTitle1, { color: theme.text }]}>
                              Vehicle Details
                            </Text>
                          
                          </View>
        
        {vehicle.imageUrl ? (
          <Image
            source={{ uri: vehicle.imageUrl }}
            style={styles.vehicleImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons
              name={getVehicleIcon(vehicle.type)}
              size={80}
              color={theme.primary}
            />
          </View>
        )}
        <View style={styles.vehicleInfo}>
          <Text style={[styles.modelName, { color: theme.text }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={[styles.modelType, { color: theme.textMuted }]}>
            {vehicle.type} • {vehicle.plate}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >

      {/* Details Section with Edit Button */}
      <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
        {/* Section Header with Edit Button */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={16} color={theme.primary} />
            <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsGrid}>
          <InfoItem label="Color" value={vehicle.color} theme={theme} />
          <InfoItem label="Fuel Type" value={vehicle.fuelType} theme={theme} />
          <InfoItem label="Engine" value={vehicle.engineCapacity} theme={theme} />
          <InfoItem label="Chassis No." value={vehicle.chassisNumber} theme={theme} />
          <InfoItem label="Registered" value={vehicle.registerYear} theme={theme} />
          <InfoItem label="Manufactured" value={vehicle.manufactureYear} theme={theme} />
          <InfoItem label="Condition" value={vehicle.condition} theme={theme} />
          <InfoItem label="Mileage" value={vehicle.mileage ? `${vehicle.mileage} km` : null} theme={theme} />
        </View>
      </View>

      {/* Update Mileage and Add Specs Buttons (Friend's Features) */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.updateMileageButton, { backgroundColor: theme.primary }]}
          onPress={handleUpdateMileage}
        >
          <Ionicons name="speedometer" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Update Mileage</Text>
        </TouchableOpacity>

     
      </View>

      {/* Service Records and Documents Buttons (Your Original Features) */}
      <View style={[styles.buttonsSection, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.squareActionButton, { backgroundColor: theme.primary }]}
          onPress={handleServiceRecords}
        >
          <Ionicons name="construct-outline" size={24} color="white" />
          <Text style={styles.squareActionButtonText}>Service Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.squareActionButton, { backgroundColor: theme.primary }]}
          onPress={handleDocuments}
        >
          <Ionicons name="document-text-outline" size={24} color="white" />
          <Text style={styles.squareActionButtonText}>Documents</Text>
        </TouchableOpacity>
      </View>

      {/* Additional space at bottom */}
      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
};

const InfoItem = ({ label, value, theme }) => (
  <View style={styles.infoItem}>
    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
 
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
    headerButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#0088ffff', // iOS blue or use your theme color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // iOS recommended touch target
    minHeight: 44,
  },
  headerTitle1: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  vehicleHeader: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 20,
  },
  vehicleImage: {
    width: 200,
    height: 150,
    marginBottom: 15,
  },
  vehicleInfo: {
    alignItems: 'center',
    marginTop: 10,
    
  },
  modelName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  modelType: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsSection: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: -10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Friend's Action Buttons (Update Mileage & Add Specs)
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updateMileageButton: {
    // Specific styles for update mileage button if needed
  },
  addSpecsButton: {
    // Specific styles for add specs button if needed
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Your Original Square Buttons (Service Records & Documents)
  buttonsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 50,
    marginTop: 20,
  },
  squareActionButton: {
    width: 100,  // Fixed width
    height: 100, // Same as width for square
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12, // Rounded corners
    gap: 10, // Space between icon and text
  },
  squareActionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Common styles
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
});

export default VehicleDetailScreen;