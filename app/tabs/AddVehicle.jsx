import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';

// --- Import your theming elements ---
import useTheme from '../../Theme/theme';
import ThemedButton from '../../components/ThemedButton';
import ThemedText from '../../components/ThemedText';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedView from '../../components/ThemedView';

// Custom themed dialog components
const ThemedAlert = ({ visible, title, message, buttons, onDismiss }) => {
  const theme = useTheme();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.alertContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={[styles.alertTitle, { color: theme.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.alertMessage, { color: theme.textMuted }]}>{message}</ThemedText>
          
          <View style={styles.alertButtonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  { backgroundColor: button.style === 'cancel' ? theme.secondary : theme.primary },
                  index === 0 && buttons.length > 1 && { marginRight: 10 }
                ]}
                onPress={button.onPress}
              >
                <ThemedText style={[
                  styles.alertButtonText,
                  { color: button.style === 'cancel' ? theme.textMuted : theme.buttonText }
                ]}>
                  {button.text}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AddVehicle() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const theme = useTheme();

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: []
  });

  // Vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    type: '',
    model: '',
    brand: '',
    manufactureYear: '',
    registerYear: '',
    fuelType: '',
    engineCapacity: '',
    mileage: '', // Added mileage field
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

  // Custom alert function
  const showAlert = (title, message, buttons) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const resetForm = () => {
    setNewVehicle({
      type: '',
      model: '',
      brand: '',
      manufactureYear: '',
      registerYear: '',
      fuelType: '',
      engineCapacity: '',
      mileage: '',
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
      showAlert('Error', 'Please fill in Vehicle Type, Model, and Number Plate (required fields).', [
        { text: 'OK', onPress: () => setAlertVisible(false) }
      ]);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showAlert('Error', 'You must be logged in to add vehicles', [
        { text: 'OK', onPress: () => setAlertVisible(false) }
      ]);
      return;
    }

    setSaving(true);

    try {
      const vehicleData = {
        ...newVehicle,
        plate: newVehicle.plate.trim().toUpperCase(),
        model: newVehicle.model.trim(),
        brand: newVehicle.brand.trim(),
        mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : null,
        createdAt: new Date(),
        userId: user.uid
      };

      const vehiclesRef = db.collection('users').doc(user.uid).collection('vehicles');
      await vehiclesRef.add(vehicleData);

      showAlert('Success', 'Vehicle added successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            setAlertVisible(false);
            resetForm();
          },
        },
        {
          text: 'Go Back',
          onPress: () => {
            setAlertVisible(false);
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showAlert('Error', 'Failed to add vehicle. Please try again.', [
        { text: 'OK', onPress: () => setAlertVisible(false) }
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(newVehicle).some(value => value && value.toString().trim() !== '')) {
      showAlert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel', onPress: () => setAlertVisible(false) },
          { text: 'Discard', onPress: () => { setAlertVisible(false); router.back(); } },
        ]
      );
    } else {
      router.back();
    }
  };

  // --- Define themedStyles inside the component to use the theme object ---
  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
    },

    // Header Styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    backButton: {
      padding: 8,
      borderRadius: 8,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
    },

    placeholder: {
      width: 40,
    },

    // Scroll View Styles
    scrollView: {
      flex: 1,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    // Notice Box
    noticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background + '20', // Semi-transparent primary color
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },

    noticeText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.error,
      fontWeight: '500',
    },

    // Form Styles
    formGroup: {
      marginBottom: 10,
    },

    formGroupHalf: {
      flex: 1,
      marginHorizontal: 5,
    },

    formRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },

    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },

    input: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },

      box: {
           fontSize: 16,
           backgroundColor: theme.inputBackground,
      color: theme.text,
     
    },

      boxlabel: {
      fontSize: 20,                 
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },

    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.inputBackground,
      overflow: 'hidden',
    },

    picker: {
      height: 50,
      color: theme.text,
    },

    // Button Styles
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },

    cancelButton: {
      flex: 1,
      backgroundColor: theme.secondary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginRight: 10,
    },

    saveButton: {
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginLeft: 10,
    },

    disabledButton: {
      opacity: 0.6,
    },

    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textMuted,
    },

    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.buttonText,
    },
  });

  return (
    <ThemedView style={themedStyles.container}>
      {/* Header */}
      <View style={themedStyles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={themedStyles.backButton}
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={themedStyles.headerTitle}>Add New Vehicle</ThemedText>
        <View style={themedStyles.placeholder} />
      </View>

      <ScrollView
        style={themedStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scrollContent}
      >
        {/* Required Fields Notice */}
        <View style={themedStyles.noticeBox}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <ThemedText style={themedStyles.noticeText}>
            Fields marked with * are required
          </ThemedText>
        </View>

        {/* Vehicle Type - Required */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Vehicle Type *</ThemedText>
          <View style={themedStyles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.type}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, type: value }))}
              enabled={!saving}
              style={themedStyles.picker}
              itemStyle={{ color: theme.text }}
            >
              <Picker.Item label="Select Vehicle Type" value="" />
              {vehicleTypes.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Brand */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Brand</ThemedText>
          <ThemedTextInput
            placeholder="e.g., Toyota, Honda, Yamaha"
            value={newVehicle.brand}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, brand: text }))}
            editable={!saving}
            style={themedStyles.input}
          />
        </View>

        {/* Model - Required */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Model *</ThemedText>
          <ThemedTextInput
            placeholder="e.g., Prius, Civic, FZ"
            value={newVehicle.model}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
            editable={!saving}
            style={themedStyles.input}
          />
        </View>

        {/* Years Row */}
        <View style={themedStyles.formRow}>
          <View style={themedStyles.formGroupHalf}>
            <ThemedText style={themedStyles.formLabel}>Manufacture Year</ThemedText>
            <View style={themedStyles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.manufactureYear}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, manufactureYear: value }))}
                enabled={!saving}
                style={themedStyles.picker}
                itemStyle={{ color: theme.text }}
              >
                <Picker.Item label="Select Year" value="" />
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={themedStyles.formGroupHalf}>
            <ThemedText style={themedStyles.formLabel}>Register Year</ThemedText>
            <View style={themedStyles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.registerYear}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, registerYear: value }))}
                enabled={!saving}
                style={themedStyles.picker}
                itemStyle={{ color: theme.text }}
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
        <View style={themedStyles.formRow}>
          <View style={themedStyles.formGroupHalf}>
            <ThemedText style={themedStyles.formLabel}>Fuel Type</ThemedText>
            <View style={themedStyles.pickerContainer}>
              <Picker
                selectedValue={newVehicle.fuelType}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, fuelType: value }))}
                enabled={!saving}
                style={themedStyles.picker}
                itemStyle={{ color: theme.text }}
              >
                <Picker.Item style={themedStyles.boxlabel} label="Select Fuel Type" value="" />
                {fuelTypes.map(fuel => (
                  <Picker.Item style={themedStyles.box} key={fuel} label={fuel} value={fuel} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={themedStyles.formGroupHalf}>
            <ThemedText style={themedStyles.formLabel}>Engine Capacity</ThemedText>
            <ThemedTextInput
              placeholder="e.g., 1800cc"
              value={newVehicle.engineCapacity}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineCapacity: text }))}
              editable={!saving}
              style={themedStyles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Mileage - New Field */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Mileage (Km)</ThemedText>
          <ThemedTextInput
            placeholder="e.g., 50000"
            value={newVehicle.mileage}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, mileage: text }))}
            editable={!saving}
            style={themedStyles.input}
            keyboardType="numeric"
          />
        </View>

        {/* Color */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Color</ThemedText>
          <View style={themedStyles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.color}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, color: value }))}
              enabled={!saving}
              style={themedStyles.picker}
              itemStyle={{ color: theme.text }}
            >
              <Picker.Item label="Select Color" value="" />
              {colors.map(color => (
                <Picker.Item key={color} label={color} value={color} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Number Plate - Required */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Number Plate *</ThemedText>
          <ThemedTextInput
            style={themedStyles.input}
            placeholder="e.g., ABC-1234"
            value={newVehicle.plate}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, plate: text }))}
            autoCapitalize="characters"
            editable={!saving}
          />
        </View>

        {/* Chassis Number */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Chassis Number</ThemedText>
          <ThemedTextInput
            style={themedStyles.input}
            placeholder="Vehicle Chassis Number"
            value={newVehicle.chassisNumber}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, chassisNumber: text }))}
            editable={!saving}
          />
        </View>

        {/* Engine Number */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Engine Number</ThemedText>
          <ThemedTextInput
            style={themedStyles.input}
            placeholder="Vehicle Engine Number"
            value={newVehicle.engineNumber}
            onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineNumber: text }))}
            editable={!saving}
          />
        </View>

        {/* Condition */}
        <View style={themedStyles.formGroup}>
          <ThemedText style={themedStyles.formLabel}>Condition</ThemedText>
          <View style={themedStyles.pickerContainer}>
            <Picker
              selectedValue={newVehicle.condition}
              onValueChange={(value) => setNewVehicle(prev => ({ ...prev, condition: value }))}
              enabled={!saving}
              style={themedStyles.picker}
              itemStyle={{ color: theme.text }}
            >
              <Picker.Item label="Select Condition" value="" />
              {conditions.map(condition => (
                <Picker.Item key={condition} label={condition} value={condition} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={themedStyles.buttonContainer}>
          <ThemedButton
            title="Cancel"
            onPress={handleCancel}
            disabled={saving}
            style={[themedStyles.cancelButton, saving && themedStyles.disabledButton]}
            textStyle={themedStyles.cancelButtonText}
          />

          <ThemedButton
            title={saving ? '' : 'Add Vehicle'}
            onPress={handleAddVehicle}
            disabled={saving}
            style={[themedStyles.saveButton, saving && themedStyles.disabledButton]}
            textStyle={themedStyles.saveButtonText}
          >
            {saving && (
              <ActivityIndicator size="small" color={theme.buttonText} />
            )}
          </ThemedButton>
        </View>
      </ScrollView>

      {/* Custom Themed Alert */}
      <ThemedAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </ThemedView>
  );
}

// Styles for the custom alert modal
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: '90%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});