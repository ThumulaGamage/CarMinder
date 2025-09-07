import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';

// --- Import your theming elements ---
import useTheme from '../../Theme/theme';
import ThemedText from '../../components/ThemedText';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedView from '../../components/ThemedView';

const { width } = Dimensions.get('window');

// Custom Vehicle Type Picker Component
const CustomVehicleTypePicker = ({ value, onValueChange, enabled = true, theme }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const vehicleTypes = [
    { label: 'Car', value: 'Car', icon: 'car' },
    { label: 'Van', value: 'Van', icon: 'car-outline' },
    { label: 'Bike', value: 'Bike', icon: 'bicycle' },
    { label: 'Truck', value: 'Truck', icon: 'car-sport' },
    { label: 'Bus', value: 'Bus', icon: 'bus' },
    { label: 'Three Wheeler', value: 'Three Wheeler', icon: 'car-outline' },
    { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal' }
  ];

  const selectedType = vehicleTypes.find(type => type.value === value);

  const selectItem = (item) => {
    onValueChange(item.value);
    setModalVisible(false);
  };

  return (
    <>
      {/* Custom Picker Button */}
      <TouchableOpacity
        style={[
          customPickerStyles.customPickerButton,
          {
            backgroundColor: theme.inputBackground || theme.card,
            borderColor: theme.border,
          }
        ]}
        onPress={() => enabled && setModalVisible(true)}
        disabled={!enabled}
        activeOpacity={0.8}
      >
        <View style={customPickerStyles.pickerContent}>
          {selectedType?.icon && (
            <Ionicons 
              name={selectedType.icon} 
              size={20} 
              color={theme.primary} 
              style={customPickerStyles.pickerIcon}
            />
          )}
          <ThemedText style={[
            customPickerStyles.pickerText,
            { color: value ? theme.text : theme.textMuted }
          ]}>
            {selectedType ? selectedType.label : 'Select Vehicle Type'}
          </ThemedText>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={theme.textMuted} 
        />
      </TouchableOpacity>

      {/* Custom Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={customPickerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[
            customPickerStyles.modalContent,
            { backgroundColor: theme.card, borderColor: theme.border }
          ]}>
            <View style={customPickerStyles.modalHeader}>
              <ThemedText style={[customPickerStyles.modalTitle, { color: theme.text }]}>
                Select Vehicle Type
              </ThemedText>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={customPickerStyles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={vehicleTypes}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    customPickerStyles.modalItem,
                    { 
                      backgroundColor: value === item.value ? theme.primary + '15' : 'transparent',
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => selectItem(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={value === item.value ? theme.primary : theme.textMuted}
                    style={customPickerStyles.modalItemIcon}
                  />
                  <ThemedText style={[
                    customPickerStyles.modalItemText,
                    { 
                      color: value === item.value ? theme.primary : theme.text,
                      fontWeight: value === item.value ? '600' : '400'
                    }
                  ]}>
                    {item.label}
                  </ThemedText>
                  {value === item.value && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

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
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
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

  // Enhanced themedStyles with improved design
  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Header Styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 15,
      backgroundColor: theme.card,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      letterSpacing: 0.5,
    },

    placeholder: {
      width: 44,
    },

    // Scroll View Styles
    scrollView: {
      flex: 1,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },

    // Section Container
    sectionContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 0.5,
      borderColor: theme.border,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border + '50',
    },

    // Notice Box
    noticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary + '15',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.primary + '30',
      shadowColor: theme.primary,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },

    noticeIcon: {
      marginRight: 12,
    },

    noticeText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
      flex: 1,
      lineHeight: 20,
    },

    // Form Styles
    formGroup: {
      marginBottom: 20,
    },

    formGroupHalf: {
      flex: 1,
      marginHorizontal: 6,
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
      marginBottom: 10,
      letterSpacing: 0.3,
    },

    requiredIndicator: {
      color: theme.error || '#FF3B30',
      fontSize: 16,
      fontWeight: 'bold',
    },

    input: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.inputBackground || theme.card,
      color: theme.text,
      fontWeight: '500',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    inputFocused: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },

    pickerContainer: {
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.inputBackground || theme.card,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    picker: {
      height: 56,
      color: theme.text,
      fontSize: 16,
      fontWeight: '500',
    },

    // Button Styles
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
      paddingTop: 20,
      gap: 16,
    },

    cancelButton: {
      flex: 1,
      backgroundColor: theme.background,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      minHeight: 56,
    },

    saveButton: {
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
      minHeight: 56,
    },

    disabledButton: {
      opacity: 0.5,
    },

    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      letterSpacing: 0.5,
    },

    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.buttonText || '#FFFFFF',
      letterSpacing: 0.5,
    },

    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: theme.buttonText || '#FFFFFF',
    },
  });

  const renderFormSection = (title, children) => (
    <View style={themedStyles.sectionContainer}>
      <ThemedText style={themedStyles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );

  const renderFormField = (label, children, required = false) => (
    <View style={themedStyles.formGroup}>
      <ThemedText style={themedStyles.formLabel}>
        {label}
        {required && <ThemedText style={themedStyles.requiredIndicator}> *</ThemedText>}
      </ThemedText>
      {children}
    </View>
  );

  return (
    <ThemedView style={themedStyles.container}>
      {/* Header */}
      <View style={themedStyles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={themedStyles.backButton}
          disabled={saving}
          activeOpacity={0.7}
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
          <View style={themedStyles.noticeIcon}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
          </View>
          <ThemedText style={themedStyles.noticeText}>
            Fields marked with * are required to add your vehicle
          </ThemedText>
        </View>

        {/* Basic Information Section */}
        {renderFormSection("Basic Information", 
          <>
            {/* Vehicle Type - Required - CUSTOM PICKER */}
            {renderFormField("Vehicle Type", 
              <CustomVehicleTypePicker
                value={newVehicle.type}
                onValueChange={(value) => setNewVehicle(prev => ({ ...prev, type: value }))}
                enabled={!saving}
                theme={theme}
              />, 
              true
            )}

            {/* Brand and Model Row */}
            <View style={themedStyles.formRow}>
              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Brand", 
                  <ThemedTextInput
                    placeholder="e.g., Toyota, Honda"
                    value={newVehicle.brand}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, brand: text }))}
                    editable={!saving}
                    style={themedStyles.input}
                  />
                )}
              </View>

              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Model", 
                  <ThemedTextInput
                    placeholder="e.g., Prius, Civic"
                    value={newVehicle.model}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
                    editable={!saving}
                    style={themedStyles.input}
                  />, 
                  true
                )}
              </View>
            </View>

            {/* Years Row */}
            <View style={themedStyles.formRow}>
              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Manufacture Year", 
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
                )}
              </View>

              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Register Year", 
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
                )}
              </View>
            </View>
          </>
        )}

        {/* Technical Specifications Section */}
        {renderFormSection("Technical Specifications", 
          <>
            {/* Fuel Type and Engine Capacity Row */}
            <View style={themedStyles.formRow}>
              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Fuel Type", 
                  <View style={themedStyles.pickerContainer}>
                    <Picker
                      selectedValue={newVehicle.fuelType}
                      onValueChange={(value) => setNewVehicle(prev => ({ ...prev, fuelType: value }))}
                      enabled={!saving}
                      style={themedStyles.picker}
                      itemStyle={{ color: theme.text }}
                    >
                      <Picker.Item label="Select Fuel Type" value="" />
                      {fuelTypes.map(fuel => (
                        <Picker.Item key={fuel} label={fuel} value={fuel} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Engine Capacity", 
                  <ThemedTextInput
                    placeholder="e.g., 1800cc"
                    value={newVehicle.engineCapacity}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineCapacity: text }))}
                    editable={!saving}
                    style={themedStyles.input}
                    keyboardType="default"
                  />
                )}
              </View>
            </View>

            {/* Mileage and Color Row */}
            <View style={themedStyles.formRow}>
              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Mileage (Km)", 
                  <ThemedTextInput
                    placeholder="e.g., 50000"
                    value={newVehicle.mileage}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, mileage: text }))}
                    editable={!saving}
                    style={themedStyles.input}
                    keyboardType="numeric"
                  />
                )}
              </View>

              <View style={themedStyles.formGroupHalf}>
                {renderFormField("Color", 
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
                )}
              </View>
            </View>

            {/* Condition */}
            {renderFormField("Condition", 
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
            )}
          </>
        )}

        {/* Registration Details Section */}
        {renderFormSection("Registration Details", 
          <>
            {/* Number Plate - Required */}
            {renderFormField("Number Plate", 
              <ThemedTextInput
                style={themedStyles.input}
                placeholder="e.g., ABC-1234"
                value={newVehicle.plate}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, plate: text }))}
                autoCapitalize="characters"
                editable={!saving}
              />, 
              true
            )}

            {/* Chassis Number */}
            {renderFormField("Chassis Number", 
              <ThemedTextInput
                style={themedStyles.input}
                placeholder="Vehicle Chassis Number"
                value={newVehicle.chassisNumber}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, chassisNumber: text }))}
                editable={!saving}
              />
            )}

            {/* Engine Number */}
            {renderFormField("Engine Number", 
              <ThemedTextInput
                style={themedStyles.input}
                placeholder="Vehicle Engine Number"
                value={newVehicle.engineNumber}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineNumber: text }))}
                editable={!saving}
              />
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={themedStyles.buttonContainer}>
          <TouchableOpacity
            onPress={handleCancel}
            disabled={saving}
            style={[themedStyles.cancelButton, saving && themedStyles.disabledButton]}
            activeOpacity={0.8}
          >
            <ThemedText style={themedStyles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAddVehicle}
            disabled={saving}
            style={[themedStyles.saveButton, saving && themedStyles.disabledButton]}
            activeOpacity={0.8}
          >
            {saving ? (
              <View style={themedStyles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.buttonText || '#FFFFFF'} />
                <ThemedText style={themedStyles.loadingText}>Adding...</ThemedText>
              </View>
            ) : (
              <ThemedText style={themedStyles.saveButtonText}>Add Vehicle</ThemedText>
            )}
          </TouchableOpacity>
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

// Custom Picker Styles
const customPickerStyles = StyleSheet.create({
  customPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalItemIcon: {
    marginRight: 16,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
});

// Styles for the custom alert modal
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: '90%',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  alertButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});