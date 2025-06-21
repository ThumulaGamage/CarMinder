import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
    
     

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Image/Icon Section */}
        <LinearGradient
          colors={[theme.primary + '20', theme.background]}
          style={styles.vehicleHeader}
        >
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

        {/* Details Section */}
        <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
          
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
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
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