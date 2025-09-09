import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

// Correct import paths
import { auth, db } from '../../../../../config/firebaseConfig';
import useTheme from '../../../../../Theme/theme';

const ServiceInput = () => {
  const theme = useTheme();
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams();
  
  // Add debug logs
  console.log('ServiceInput - vehicleId:', vehicleId);
  console.log('Auth object:', auth);
  console.log('DB object:', db);
  
  const [formData, setFormData] = useState({
    oilServiceMileage: '',
    fullServiceMileage: '',
    tyreChangeMileage: '',
    brakeOilDate: new Date(),
    batteryCheckDate: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState({
    brakeOil: false,
    battery: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch existing service data when component mounts
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!vehicleId || !auth?.currentUser) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        const vehicleDoc = await db
          .collection('users')
          .doc(userId)
          .collection('vehicles')
          .doc(vehicleId.toString())
          .get();

        if (vehicleDoc.exists) {
          const data = vehicleDoc.data();
          console.log('Fetched vehicle data:', data);
          
          // Update form data with existing values
          setFormData(prev => ({
            ...prev,
            oilServiceMileage: data.oilServiceMileage ? data.oilServiceMileage.toString() : '',
            fullServiceMileage: data.fullServiceMileage ? data.fullServiceMileage.toString() : '',
            tyreChangeMileage: data.tyreChangeMileage ? data.tyreChangeMileage.toString() : '',
            brakeOilDate: data.brakeOilDate ? new Date(data.brakeOilDate) : new Date(),
            batteryCheckDate: data.batteryCheckDate ? new Date(data.batteryCheckDate) : new Date(),
          }));
        } else {
          console.log('Vehicle document does not exist');
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
        Alert.alert('Warning', 'Could not load existing service data. You can still update the records.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchServiceData();
  }, [vehicleId, auth?.currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate, field) => {
    setShowDatePicker(prev => ({
      ...prev,
      [field]: false,
    }));
    
    if (selectedDate) {
      const fieldName = field === 'brakeOil' ? 'brakeOilDate' : 'batteryCheckDate';
      setFormData(prev => ({
        ...prev,
        [fieldName]: selectedDate,
      }));
    }
  };

  const showDatePickerModal = (field) => {
    setShowDatePicker(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB');
  };

  const validateForm = () => {
    if (!vehicleId) {
      Alert.alert('Error', 'Vehicle ID is missing. Please try again.');
      return false;
    }

    const hasData = formData.oilServiceMileage || 
                   formData.fullServiceMileage || 
                   formData.tyreChangeMileage;
    
    if (!hasData) {
      Alert.alert('Validation Error', 'Please fill in at least one service detail.');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Check if auth is available
      if (!auth || !auth.currentUser) {
        Alert.alert('Error', 'User not authenticated. Please login again.');
        setIsLoading(false);
        return;
      }

      // Get the current user ID
      const userId = auth.currentUser.uid;
      
      console.log('Current user ID:', userId);
      console.log('Vehicle ID:', vehicleId);

      if (!userId) {
        Alert.alert('Error', 'Unable to get user ID. Please login again.');
        setIsLoading(false);
        return;
      }

      // Create service data object (only include fields that have values)
      const serviceData = {
        lastServiceUpdate: new Date().toISOString(), // Always update this timestamp
      };

      // Only add fields that have values
      if (formData.oilServiceMileage) {
        serviceData.oilServiceMileage = parseInt(formData.oilServiceMileage);
      }
      
      if (formData.fullServiceMileage) {
        serviceData.fullServiceMileage = parseInt(formData.fullServiceMileage);
      }
      
      if (formData.tyreChangeMileage) {
        serviceData.tyreChangeMileage = parseInt(formData.tyreChangeMileage);
      }

      // Always update dates (they always have values)
      serviceData.brakeOilDate = formData.brakeOilDate.toISOString();
      serviceData.batteryCheckDate = formData.batteryCheckDate.toISOString();

      console.log('Updating vehicle document with service data:', serviceData);

      // UPDATE the existing vehicle document instead of creating a new subcollection
      await db
        .collection('users')
        .doc(userId)
        .collection('vehicles')
        .doc(vehicleId.toString())
        .update(serviceData); // Use update() instead of add()

      console.log('Vehicle document updated successfully with service data');
      
      Alert.alert(
        'Success',
        'Service records updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating service records:', error);
      console.error('Error details:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'not-found') {
        Alert.alert(
          'Error',
          'Vehicle not found. Please make sure the vehicle exists.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to update service records: ${error.message}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Check if required dependencies are loaded
  if (!auth || !db) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.container}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Error: Firebase not properly initialized. Check your imports.
          </Text>
          <TouchableOpacity onPress={handleCancel} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.saveButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicleId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.container}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Error: Vehicle ID not found. Please go back and try again.
          </Text>
          <TouchableOpacity onPress={handleCancel} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.saveButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading spinner while fetching initial data
  if (isInitialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading service data...
          </Text>
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
            Update Service Records
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={isLoading}
          >
            <Text style={[styles.saveText, { 
              color: isLoading ? theme.textMuted : theme.primary 
            }]}>
              {isLoading ? 'Updating...' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoTitle, { color: theme.primary }]}>Service Update</Text>
          </View>
          <Text style={[styles.infoText, { color: theme.text }]}>
            This will update your vehicle's service information. Existing values are pre-filled for your convenience.
          </Text>
        </View>

        {/* Debug info */}
        <View style={[styles.debugContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.debugText, { color: theme.textMuted }]}>
            Vehicle ID: {vehicleId}
          </Text>
          <Text style={[styles.debugText, { color: theme.textMuted }]}>
            User ID: {auth?.currentUser?.uid || 'Not logged in'}
          </Text>
        </View>

        {/* Mileage Services Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mileage-Based Services</Text>
          </View>
          
          <InputField
            label="Oil Service Mileage (km)"
            value={formData.oilServiceMileage}
            onChangeText={(value) => handleInputChange('oilServiceMileage', value)}
            placeholder="e.g., 45000"
            keyboardType="numeric"
            icon="car-outline"
            theme={theme}
          />
          
          <InputField
            label="Full Service Mileage (km)"
            value={formData.fullServiceMileage}
            onChangeText={(value) => handleInputChange('fullServiceMileage', value)}
            placeholder="e.g., 40000"
            keyboardType="numeric"
            icon="construct-outline"
            theme={theme}
          />
          
          <InputField
            label="Tyre Change Mileage (km)"
            value={formData.tyreChangeMileage}
            onChangeText={(value) => handleInputChange('tyreChangeMileage', value)}
            placeholder="e.g., 35000"
            keyboardType="numeric"
            icon="ellipse-outline"
            theme={theme}
          />
        </View>

        {/* Date-Based Services Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Date-Based Services</Text>
          </View>
          
          <DateInputField
            label="Brake Oil Change Date"
            value={formatDate(formData.brakeOilDate)}
            onPress={() => showDatePickerModal('brakeOil')}
            icon="disc-outline"
            theme={theme}
          />
          
          <DateInputField
            label="Battery Check Date"
            value={formatDate(formData.batteryCheckDate)}
            onPress={() => showDatePickerModal('battery')}
            icon="battery-charging-outline"
            theme={theme}
          />
        </View>

        {/* Service Tips Section */}
        <View style={[styles.tipSection, { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={20} color={theme.primary} />
            <Text style={[styles.tipTitle, { color: theme.primary }]}>Service Tips</Text>
          </View>
          <Text style={[styles.tipText, { color: theme.text }]}>
            • Oil service: Every 5,000-7,500 km or 6 months{'\n'}
            • Full service: Every 10,000-15,000 km or 12 months{'\n'}
            • Tyre change: Every 40,000-60,000 km or when worn{'\n'}
            • Brake oil: Every 2 years or 40,000 km{'\n'}
            • Battery check: Every 6 months
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.textMuted }]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Ionicons name="close" size={20} color={theme.textMuted} />
            <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: isLoading ? theme.textMuted : theme.primary,
              opacity: isLoading ? 0.7 : 1
            }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name={isLoading ? "time" : "checkmark"} size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Updating...' : 'Update Records'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker.brakeOil && (
        <DateTimePicker
          value={formData.brakeOilDate}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, 'brakeOil')}
        />
      )}
      
      {showDatePicker.battery && (
        <DateTimePicker
          value={formData.batteryCheckDate}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, 'battery')}
        />
      )}
    </SafeAreaView>
  );
};

// Component definitions remain the same...
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
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  </View>
);

const DateInputField = ({ label, value, onPress, icon, theme }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={16} color={theme.primary} style={styles.labelIcon} />
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
    </View>
    <TouchableOpacity 
      style={[styles.dateInputContainer, { borderColor: theme.border || theme.textMuted + '40', backgroundColor: theme.background }]}
      onPress={onPress}
    >
      <Text style={[styles.dateText, { color: theme.text }]}>{value}</Text>
      <Ionicons name="calendar" size={20} color={theme.primary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
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
  infoSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  debugContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
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
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
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
  dateInputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
  },
  tipSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
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
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ServiceInput;