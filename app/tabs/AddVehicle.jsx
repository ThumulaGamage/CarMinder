import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import { styles } from '../../constant/AddVehicleStyles'; // Separate styles file
import Colors from '../../constant/Colors';

export default function AddVehicle() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    type: '',
    model: '',
    brand: '',
    manufactureYear: '',
    registerYear: '',
    fuelType: '',
    engineCapacity: '',
    color: '',
    plate: '',
    chassisNumber: '',
    engineNumber: '',
    condition: ''
  });

  // Dropdown options
  const vehicleTypes = ['Car', 'Van', 'Bike', 'Truck', 'Bus', 'Three Wheeler', 'Other'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
  const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray', 'Brown', 'Green', 'Yellow', 'Other'];
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];

  // Generate year arrays
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const resetForm = () => {
    setNewVehicle({
      type: '',
      model: '',
      brand: '',
      manufactureYear: '',
      registerYear: '',
      fuelType: '',
      engineCapacity: '',
      color: '',
      plate: '',
      chassisNumber: '',
      engineNumber: '',
      condition: ''
    });
  };

  const handleAddVehicle = async () => {
    // Validate required fields
    if (!newVehicle.type || !newVehicle.model || !newVehicle.plate) {
      Alert.alert('Error', 'Please fill in Vehicle Type, Model, and Number Plate (required fields).');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add vehicles');
      return;
    }

    setSaving(true);
    
    try {
      const vehicleData = {
        ...newVehicle,
        plate: newVehicle.plate.trim().toUpperCase(),
        model: newVehicle.model.trim(),
        brand: newVehicle.brand.trim(),
        createdAt: new Date(),
        userId: user.uid
      };

      const vehiclesRef = db.collection('users').doc(user.uid).collection('vehicles');
      await vehiclesRef.add(vehicleData);

      Alert.alert(
        'Success', 
        'Vehicle added successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => resetForm(),
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'Failed to add vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(newVehicle).some(value => value.trim() !== '')) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel}
          style={styles.backButton}
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.BLUE_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Vehicle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Required Fields Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={20} color={Colors.BLUE_DARK} />
          <Text style={styles.noticeText}>
            Fields marked with * are required
          </Text>
        </View>

        {/* Vehicle Type - Required */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Vehicle Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.type}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, type: value }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Select Vehicle Type" value="" />
              {vehicleTypes.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Brand */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Toyota, Honda, Yamaha"
            value={newVehicle.brand}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, brand: text }))}
            editable={!saving}
          />
        </View>

        {/* Model - Required */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Model *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Prius, Civic, FZ"
            value={newVehicle.model}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
            editable={!saving}
          />
        </View>

        {/* Years Row */}
        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>Manufacture Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.manufactureYear}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, manufactureYear: value }))}
                enabled={!saving}
                style={styles.picker}
              >
                <Picker.Item label="Select Year" value="" />
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>Register Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.registerYear}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, registerYear: value }))}
                enabled={!saving}
                style={styles.picker}
              >
                <Picker.Item label="Select Year" value="" />
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Fuel Type and Engine Capacity Row */}
        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>Fuel Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.fuelType}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, fuelType: value }))}
                enabled={!saving}
                style={styles.picker}
              >
                <Picker.Item label="Select Fuel Type" value="" />
                {fuelTypes.map(fuel => (
                  <Picker.Item key={fuel} label={fuel} value={fuel} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>Engine Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1800cc"
              value={newVehicle.engineCapacity}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineCapacity: text }))}
              editable={!saving}
            />
          </View>
        </View>

        {/* Color */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Color</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.color}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, color: value }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Select Color" value="" />
              {colors.map(color => (
                <Picker.Item key={color} label={color} value={color} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Number Plate - Required */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Number Plate *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC-1234"
            value={newVehicle.plate}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, plate: text }))}
            autoCapitalize="characters"
            editable={!saving}
          />
        </View>

        {/* Chassis Number */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Chassis Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Vehicle Chassis Number"
            value={newVehicle.chassisNumber}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, chassisNumber: text }))}
            editable={!saving}
          />
        </View>

        {/* Engine Number */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Engine Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Vehicle Engine Number"
            value={newVehicle.engineNumber}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineNumber: text }))}
            editable={!saving}
          />
        </View>

        {/* Condition */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Condition</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.condition}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, condition: value }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Select Condition" value="" />
              {conditions.map(condition => (
                <Picker.Item key={condition} label={condition} value={condition} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={[styles.cancelButton, saving && styles.disabledButton]} 
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.saveButton, saving && styles.disabledButton]} 
            onPress={handleAddVehicle}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Add Vehicle</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}