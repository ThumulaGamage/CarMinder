import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../../../../config/firebaseConfig';
import useTheme from '../../../../../Theme/theme';

const MileageUpdate = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleId = params.vehicleId;

  const [vehicle, setVehicle] = useState(null);
  const [currentMileage, setCurrentMileage] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !vehicleId) {
        setLoading(false);
        return;
      }

      const vehicleDocRef = doc(db, 'users', userId, 'vehicles', vehicleId);
      const docSnap = await getDoc(vehicleDocRef);

      if (docSnap.exists()) {
        const vehicleData = { id: docSnap.id, ...docSnap.data() };
        setVehicle(vehicleData);
        setCurrentMileage(vehicleData.mileage || '0');
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      Alert.alert('Error', 'Failed to fetch vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newMileage.trim()) {
      Alert.alert('Invalid Input', 'Please enter a mileage value');
      return;
    }

    const mileageValue = parseInt(newMileage.trim());
    if (isNaN(mileageValue) || mileageValue < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid positive number');
      return;
    }

    const currentMileageValue = parseInt(currentMileage) || 0;
    if (mileageValue <= currentMileageValue) {
      Alert.alert(
        'Invalid Mileage', 
        `New mileage must be greater than current mileage (${currentMileageValue} km)`
      );
      return;
    }

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      const vehicleDocRef = doc(db, 'users', userId, 'vehicles', vehicleId);
      
      await updateDoc(vehicleDocRef, {
        mileage: mileageValue.toString(),
        lastUpdated: new Date().toISOString(),
      });

      Alert.alert('Success', 'Mileage updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to vehicle details with refresh parameter
            router.push({
              pathname: `/tabs/vehicle/${vehicleId}/Vehicle Details`,
              params: { refresh: Date.now().toString() }
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating mileage:', error);
      Alert.alert('Error', 'Failed to update mileage. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Alternative save function without alert (smoother UX)
  const handleSaveQuick = async () => {
    if (!newMileage.trim()) {
      Alert.alert('Invalid Input', 'Please enter a mileage value');
      return;
    }

    const mileageValue = parseInt(newMileage.trim());
    if (isNaN(mileageValue) || mileageValue < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid positive number');
      return;
    }

    const currentMileageValue = parseInt(currentMileage) || 0;
    if (mileageValue <= currentMileageValue) {
      Alert.alert(
        'Invalid Mileage', 
        `New mileage must be greater than current mileage (${currentMileageValue} km)`
      );
      return;
    }

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      const vehicleDocRef = doc(db, 'users', userId, 'vehicles', vehicleId);
      
      await updateDoc(vehicleDocRef, {
        mileage: mileageValue.toString(),
        lastUpdated: new Date().toISOString(),
      });

      // Navigate immediately after successful save
      router.replace(`/tabs/vehicle/${vehicleId}/vehicle-details`);
      
    } catch (error) {
      console.error('Error updating mileage:', error);
      Alert.alert('Error', 'Failed to update mileage. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen 
          options={{
            title: 'Update Mileage',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
          }} 
        />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!vehicle) {
    return (
      <>
        <Stack.Screen 
          options={{
            title: 'Update Mileage',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
          }} 
        />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.centered}>
            <Ionicons name="alert-circle" size={64} color={theme.textMuted} />
            <Text style={[styles.errorText, { color: theme.text }]}>Vehicle not found</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Mileage Update
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={[styles.buttonText, { color:'#ffffff' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          
          {/* Vehicle Info Card */}
          <View style={[styles.vehicleCard, { backgroundColor: theme.card }]}>
            <View style={styles.vehicleHeader}>
              <Ionicons name="car-sport" size={32} color={theme.primary} />
              <View style={styles.vehicleDetails}>
                <Text style={[styles.vehicleName, { color: theme.text }]}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={[styles.vehiclePlate, { color: theme.textMuted }]}>
                  {vehicle.plate}
                </Text>
              </View>
            </View>
          </View>

          {/* Current Mileage */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Mileage</Text>
            <View style={styles.mileageDisplay}>
              <Ionicons name="speedometer" size={24} color={theme.primary} />
              <Text style={[styles.mileageText, { color: theme.text }]}>
                {currentMileage} km
              </Text>
            </View>
          </View>

          {/* New Mileage Input */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>New Mileage</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={newMileage}
                onChangeText={setNewMileage}
                placeholder="Enter new mileage"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text style={[styles.unitText, { color: theme.textMuted }]}>km</Text>
            </View>
          </View>

        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { backgroundColor: theme.primary },
              saving && { opacity: 0.7 }
            ]}
            onPress={handleSave} // Use handleSaveQuick for no alert version
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveButtonText}>Update Mileage</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
  headerButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#ff0000ff', // Changed from red to blue
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    marginRight: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  mileageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mileageText: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default MileageUpdate;