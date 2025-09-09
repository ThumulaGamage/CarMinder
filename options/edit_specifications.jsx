import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { auth, db } from '../../../config/firebaseConfig';
import useTheme from '../../../Theme/theme';

const EditSpecifications = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  
  // Form state for only the editable fields
  const [formData, setFormData] = useState({
    color: '',
    fuelType: '',
    engineCapacity: '',
    chassisNumber: '',
    registerYear: '',
    manufactureYear: '',
    condition: '',
    mileage: '',
  });

  const selectedVehicleId = params.vehicleId;

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
          const vehicleData = { id: docSnap.id, ...docSnap.data() };
          setVehicle(vehicleData);
          
          // Populate form with existing data
          setFormData({
            color: vehicleData.color || '',
            fuelType: vehicleData.fuelType || '',
            engineCapacity: vehicleData.engineCapacity || '',
            chassisNumber: vehicleData.chassisNumber || '',
            registerYear: vehicleData.registerYear || '',
            manufactureYear: vehicleData.manufactureYear || '',
            condition: vehicleData.condition || '',
            mileage: vehicleData.mileage?.toString() || '',
          });
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated.');
        setSaving(false);
        return;
      }

      const vehicleDocRef = doc(db, 'users', userId, 'vehicles', selectedVehicleId);
      
      // Prepare update data
      const updateData = {
        color: formData.color.trim(),
        fuelType: formData.fuelType.trim(),
        engineCapacity: formData.engineCapacity.trim(),
        chassisNumber: formData.chassisNumber.trim(),
        registerYear: formData.registerYear.trim(),
        manufactureYear: formData.manufactureYear.trim(),
        condition: formData.condition.trim(),
        mileage: formData.mileage.trim() ? parseInt(formData.mileage) : null,
        updatedAt: new Date(),
      };

      await updateDoc(vehicleDocRef, updateData);
      
      Alert.alert('Success', 'Confirm changes', [
        {
          text: 'CONFIRM',
          onPress: () =>  {
            // Force refresh the previous screen by passing refresh parameter
             router.push("/tabs/HomeTab"); 
            // Alternative: You can also navigate back with refresh parameter
            // router.replace({ pathname: router.back(), params: { refresh: Date.now() } });
          },
        }
      ]);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle specifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading vehicle data...</Text>
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
      {/* Header */}
      <LinearGradient
        colors={[theme.primary + '10', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit Specifications
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, saving && styles.headerButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size={20} color={theme.primary} />
            ) : (
              <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Specifications Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle Specifications</Text>
          </View>
          
          {/* Two Column Layout */}
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <InputField
                label="Color"
                value={formData.color}
                onChangeText={(value) => handleInputChange('color', value)}
                placeholder="e.g., Red, Blue, White"
                icon="color-palette-outline"
                theme={theme}
              />
            </View>
            <View style={styles.column}>
              <InputField
                label="Fuel Type"
                value={formData.fuelType}
                onChangeText={(value) => handleInputChange('fuelType', value)}
                placeholder="e.g., Petrol, Diesel"
                icon="flash-outline"
                theme={theme}
              />
            </View>
          </View>

          <InputField
            label="Engine Capacity (cc)"
            value={formData.engineCapacity}
            onChangeText={(value) => handleInputChange('engineCapacity', value)}
            placeholder="e.g., 1500, 2000"
            keyboardType="numeric"
            icon="hardware-chip-outline"
            theme={theme}
          />
          
          <InputField
            label="Chassis Number"
            value={formData.chassisNumber}
            onChangeText={(value) => handleInputChange('chassisNumber', value)}
            placeholder="Vehicle identification number"
            icon="barcode-outline"
            theme={theme}
          />

          {/* Two Column Layout for Years */}
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <InputField
                label="Registered"
                value={formData.registerYear}
                onChangeText={(value) => handleInputChange('registerYear', value)}
                placeholder="e.g., 2020"
                keyboardType="numeric"
                icon="calendar-outline"
                theme={theme}
              />
            </View>
            <View style={styles.column}>
              <InputField
                label="Manufactured"
                value={formData.manufactureYear}
                onChangeText={(value) => handleInputChange('manufactureYear', value)}
                placeholder="e.g., 2019"
                keyboardType="numeric"
                icon="build-outline"
                theme={theme}
              />
            </View>
          </View>

          <InputField
            label="Condition"
            value={formData.condition}
            onChangeText={(value) => handleInputChange('condition', value)}
            placeholder="e.g., Excellent, Good, Fair"
            icon="star-outline"
            theme={theme}
          />
          
          <InputField
            label="Mileage (km)"
            value={formData.mileage}
            onChangeText={(value) => handleInputChange('mileage', value)}
            placeholder="e.g., 50000"
            keyboardType="numeric"
            icon="speedometer-outline"
            theme={theme}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.textMuted }]}
            onPress={handleCancel}
          >
            <Ionicons name="close" size={20} color={theme.textMuted} />
            <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size={20} color="white" />
            ) : (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced Input Field Component with Icons
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon, theme }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={16} color={theme.primary} style={styles.labelIcon} />
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
    </View>
    <View style={[styles.textInputContainer, { borderColor: theme.border || theme.textMuted + '40' }]}>
      <TextInput
        style={[styles.textInput, { backgroundColor: theme.background, color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default EditSpecifications;