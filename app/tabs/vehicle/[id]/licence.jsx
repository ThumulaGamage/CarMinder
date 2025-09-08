import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, getDocs, doc, setDoc, addDoc, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../../config/firebaseConfig';
import useTheme from '../../../../Theme/theme';
import ThemedText from '../../../../components/ThemedText';
import ThemedView from '../../../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function LicenceScreen() {
  const router = useRouter();
  const theme = useTheme();

  // State variables
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('license'); // 'license' or 'insurance'

  // License states
  const [startDate, setStartDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [reminderStatus, setReminderStatus] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [reminderDays, setReminderDays] = useState('30');

  // Insurance states
  const [insuranceStartDate, setInsuranceStartDate] = useState('');
  const [insuranceExpireDate, setInsuranceExpireDate] = useState('');
  const [insuranceReminderStatus, setInsuranceReminderStatus] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceReminderDays, setInsuranceReminderDays] = useState('30');
  const [coverageType, setCoverageType] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVehicleList, setShowVehicleList] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Loading vehicles for user:', user.uid);

      // Get all vehicles
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesQuery = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);

      const vehiclesList = [];
      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() };

        // Try to get existing license data for this vehicle
        try {
          const licensesRef = collection(db, 'users', user.uid, 'licenses');
          const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicleDoc.id));
          const licenseSnap = await getDocs(licenseQuery);

          if (!licenseSnap.empty) {
            const licenseData = licenseSnap.docs[0].data();
            vehicleData.licenseData = licenseData;
          } else {
            vehicleData.licenseData = null;
          }

        } catch (error) {
          console.log('No license data for vehicle:', vehicleDoc.id);
          vehicleData.licenseData = null;
        }

        // Try to get existing insurance data for this vehicle
        try {
          const insuranceRef = collection(db, 'users', user.uid, 'insurance');
          const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicleDoc.id));
          const insuranceSnap = await getDocs(insuranceQuery);

          if (!insuranceSnap.empty) {
            const insuranceData = insuranceSnap.docs[0].data();
            vehicleData.insuranceData = insuranceData;
          } else {
            vehicleData.insuranceData = null;
          }

        } catch (error) {
          console.log('No insurance data for vehicle:', vehicleDoc.id);
          vehicleData.insuranceData = null;
        }

        vehiclesList.push(vehicleData);
      }

      setVehicles(vehiclesList);
      console.log('Loaded vehicles:', vehiclesList.length);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectVehicle = (vehicle) => {
    console.log('Selected vehicle:', vehicle);
    setSelectedVehicle(vehicle);
    setShowVehicleList(false);

    // Load existing license data if available
    if (vehicle.licenseData) {
      setStartDate(vehicle.licenseData.startDate || '');
      setExpireDate(vehicle.licenseData.expireDate || '');
      setLicenseNumber(vehicle.licenseData.licenseNumber || '');
      setIssuingAuthority(vehicle.licenseData.issuingAuthority || '');
      setReminderDays(vehicle.licenseData.reminderDays || '30');

      if (vehicle.licenseData.expireDate) {
        checkExpirationStatus(vehicle.licenseData.expireDate, 'license');
      }
    } else {
      // Reset license form for new license
      setStartDate('');
      setExpireDate('');
      setLicenseNumber('');
      setIssuingAuthority('');
      setReminderDays('30');
      setReminderStatus('');
    }

    // Load existing insurance data if available
    if (vehicle.insuranceData) {
      setInsuranceStartDate(vehicle.insuranceData.startDate || '');
      setInsuranceExpireDate(vehicle.insuranceData.expireDate || '');
      setInsurancePolicyNumber(vehicle.insuranceData.policyNumber || '');
      setInsuranceProvider(vehicle.insuranceData.provider || '');
      setInsuranceReminderDays(vehicle.insuranceData.reminderDays || '30');
      setCoverageType(vehicle.insuranceData.coverageType || '');
      setPremiumAmount(vehicle.insuranceData.premiumAmount || '');

      if (vehicle.insuranceData.expireDate) {
        checkExpirationStatus(vehicle.insuranceData.expireDate, 'insurance');
      }
    } else {
      // Reset insurance form for new insurance
      setInsuranceStartDate('');
      setInsuranceExpireDate('');
      setInsurancePolicyNumber('');
      setInsuranceProvider('');
      setInsuranceReminderDays('30');
      setCoverageType('');
      setPremiumAmount('');
      setInsuranceReminderStatus('');
    }
  };

  const goBackToVehicleList = () => {
    setShowVehicleList(true);
    setSelectedVehicle(null);
    setActiveTab('license');

    // Reset license form
    setStartDate('');
    setExpireDate('');
    setLicenseNumber('');
    setIssuingAuthority('');
    setReminderDays('30');
    setReminderStatus('');

    // Reset insurance form
    setInsuranceStartDate('');
    setInsuranceExpireDate('');
    setInsurancePolicyNumber('');
    setInsuranceProvider('');
    setInsuranceReminderDays('30');
    setCoverageType('');
    setPremiumAmount('');
    setInsuranceReminderStatus('');
  };

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) return false;
    const date = new Date(dateString);
    return dateString === date.toISOString().split('T')[0];
  };

  const checkExpirationStatus = (dateString, type = 'license') => {
    if (!dateString) {
      if (type === 'license') {
        setReminderStatus('');
      } else {
        setInsuranceReminderStatus('');
      }
      return;
    }

    const today = new Date();
    const expiry = new Date(dateString);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const reminderDaysValue = type === 'license' ? reminderDays : insuranceReminderDays;

    let status = '';
    if (daysDiff < 0) {
      status = 'expired';
    } else if (daysDiff <= 7) {
      status = 'critical';
    } else if (daysDiff <= parseInt(reminderDaysValue)) {
      status = 'warning';
    } else {
      status = 'valid';
    }

    if (type === 'license') {
      setReminderStatus(status);
    } else {
      setInsuranceReminderStatus(status);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return '#FF4444';
      case 'critical': return '#FF6B6B';
      case 'warning': return '#FFA500';
      default: return '#4CAF50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'expired': return 'EXPIRED';
      case 'critical': return 'EXPIRES SOON';
      case 'warning': return 'RENEWAL DUE';
      default: return 'VALID';
    }
  };

  const getDaysRemaining = (expDate) => {
    if (!expDate) return null;
    const today = new Date();
    const expiry = new Date(expDate);
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const validateLicenseInputs = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle first.');
      return false;
    }

    if (!startDate || !expireDate) {
      Alert.alert('Missing Information', 'Please enter both start and expire dates.');
      return false;
    }

    if (!licenseNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter the license number.');
      return false;
    }

    if (!isValidDate(startDate) || !isValidDate(expireDate)) {
      Alert.alert('Invalid Format', 'Please use YYYY-MM-DD format for dates (e.g., 2024-12-31).');
      return false;
    }

    if (new Date(startDate) >= new Date(expireDate)) {
      Alert.alert('Invalid Dates', 'Expire date must be after start date.');
      return false;
    }

    return true;
  };

  const validateInsuranceInputs = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle first.');
      return false;
    }

    if (!insuranceStartDate || !insuranceExpireDate) {
      Alert.alert('Missing Information', 'Please enter both start and expire dates.');
      return false;
    }

    if (!insurancePolicyNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter the policy number.');
      return false;
    }

    if (!isValidDate(insuranceStartDate) || !isValidDate(insuranceExpireDate)) {
      Alert.alert('Invalid Format', 'Please use YYYY-MM-DD format for dates (e.g., 2024-12-31).');
      return false;
    }

    if (new Date(insuranceStartDate) >= new Date(insuranceExpireDate)) {
      Alert.alert('Invalid Dates', 'Expire date must be after start date.');
      return false;
    }

    return true;
  };

  const saveLicenseData = async () => {
    if (!validateLicenseInputs()) return;

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Please log in to save license data.');
        return;
      }

      const licenseData = {
        startDate: startDate,
        expireDate: expireDate,
        licenseNumber: licenseNumber.trim(),
        issuingAuthority: issuingAuthority.trim(),
        reminderStatus,
        reminderDays: reminderDays,
        lastUpdated: new Date().toISOString(),
        vehicleId: selectedVehicle.id,
        userId: userId,
        vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        plateNumber: selectedVehicle.plate
      };

      console.log('Saving license data:', licenseData);

      // Save to Firebase: users/{userId}/licenses/{vehicleId}
      const licenseDocRef = doc(db, 'users', userId, 'licenses', selectedVehicle.id);
      await setDoc(licenseDocRef, licenseData);

      console.log('License data saved successfully');
      Alert.alert('Success', 'License information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Refresh vehicle list to show updated license data
            loadVehicles();
          }
        }
      ]);

    } catch (error) {
      console.error('Error saving license data:', error);
      Alert.alert('Error', 'Failed to save license data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveInsuranceData = async () => {
    if (!validateInsuranceInputs()) return;

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Please log in to save insurance data.');
        return;
      }

      const insuranceData = {
        startDate: insuranceStartDate,
        expireDate: insuranceExpireDate,
        policyNumber: insurancePolicyNumber.trim(),
        provider: insuranceProvider.trim(),
        coverageType: coverageType.trim(),
        premiumAmount: premiumAmount.trim(),
        reminderStatus: insuranceReminderStatus,
        reminderDays: insuranceReminderDays,
        lastUpdated: new Date().toISOString(),
        vehicleId: selectedVehicle.id,
        userId: userId,
        vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        plateNumber: selectedVehicle.plate
      };

      console.log('Saving insurance data:', insuranceData);

      // Save to Firebase: users/{userId}/insurance/{vehicleId}
      const insuranceDocRef = doc(db, 'users', userId, 'insurance', selectedVehicle.id);
      await setDoc(insuranceDocRef, insuranceData);

      console.log('Insurance data saved successfully');
      Alert.alert('Success', 'Insurance information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Refresh vehicle list to show updated insurance data
            loadVehicles();
          }
        }
      ]);

    } catch (error) {
      console.error('Error saving insurance data:', error);
      Alert.alert('Error', 'Failed to save insurance data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveReminder = async (daysRemaining, type = 'license') => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedVehicle) return;

      const reminderData = {
        vehicleId: selectedVehicle.id,
        type: type === 'license' ? 'license_expiry' : 'insurance_expiry',
        message: `${type === 'license' ? 'License' : 'Insurance'} expires in ${daysRemaining} days`,
        daysRemaining: daysRemaining,
        expireDate: type === 'license' ? expireDate : insuranceExpireDate,
        createdAt: new Date().toISOString(),
        isActive: true,
        vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`
      };

      const remindersRef = collection(db, 'users', userId, 'reminders');
      await addDoc(remindersRef, reminderData);

      Alert.alert(
        'Reminder Set',
        `You will be reminded about your ${type} renewal. Days remaining: ${daysRemaining}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to set reminder.');
    }
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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.text }]}>
          Loading vehicles...
        </ThemedText>
      </View>
    );
  }

  // Show vehicle selection list
  if (showVehicleList) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Select Vehicle
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose a vehicle to manage its license and insurance
          </ThemedText>
        </ThemedView>

        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.vehicleCard, { backgroundColor: theme.card }]}
              onPress={() => selectVehicle(item)}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleIconContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.secondary }]}>
                  <Ionicons name={getVehicleIcon(item.type)} size={32} color={theme.icon} />
                </View>
              </View>

              <View style={styles.vehicleDetails}>
                <Text style={[styles.vehicleModel, { color: theme.text }]}>
                  {item.brand} {item.model}
                </Text>
                <Text style={[styles.plateNumber, { color: theme.textMuted }]}>
                  {item.plate}
                </Text>

                <View style={styles.badgeContainer}>
                  {item.licenseData ? (
                    <View style={[styles.licenseBadge, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.licenseBadgeText}>License ✓</Text>
                    </View>
                  ) : (
                    <View style={[styles.licenseBadge, { backgroundColor: '#FF9800' }]}>
                      <Text style={styles.licenseBadgeText}>No License</Text>
                    </View>
                  )}

                  {item.insuranceData ? (
                    <View style={[styles.licenseBadge, { backgroundColor: '#2196F3', marginLeft: 8 }]}>
                      <Text style={styles.licenseBadgeText}>Insurance ✓</Text>
                    </View>
                  ) : (
                    <View style={[styles.licenseBadge, { backgroundColor: '#FF9800', marginLeft: 8 }]}>
                      <Text style={styles.licenseBadgeText}>No Insurance</Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color={theme.textMuted} />
              <ThemedText style={[styles.emptyText, { color: theme.text }]}>
                No vehicles found. Add a vehicle first.
              </ThemedText>
            </View>
          }
          contentContainerStyle={vehicles.length === 0 ? styles.emptyListContainer : styles.listContainer}
        />
      </View>
    );
  }

  // Show license/insurance form for selected vehicle
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with back button */}
      <View style={styles.formHeader}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.card }]}
          onPress={goBackToVehicleList}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Vehicle Documents
          </ThemedText>
          <ThemedText style={[styles.vehicleInfo, { color: theme.textSecondary }]}>
            {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
          </ThemedText>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'license' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('license')}
        >
          <Ionicons
            name="card"
            size={20}
            color={activeTab === 'license' ? 'white' : theme.text}
          />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === 'license' ? 'white' : theme.text }
          ]}>
            License
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'insurance' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('insurance')}
        >
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={activeTab === 'insurance' ? 'white' : theme.text}
          />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === 'insurance' ? 'white' : theme.text }
          ]}>
            Insurance
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* License Tab Content */}
      {activeTab === 'license' && (
        <>
          {/* License Status Display */}
          {reminderStatus && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reminderStatus) }]}>
              <ThemedText style={styles.statusText}>
                {getStatusText(reminderStatus)}
              </ThemedText>
              {getDaysRemaining(expireDate) !== null && getDaysRemaining(expireDate) >= 0 && (
                <ThemedText style={styles.daysText}>
                  {getDaysRemaining(expireDate)} days remaining
                </ThemedText>
              )}
            </View>
          )}

          {/* License Form */}
          <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
              License Details
            </ThemedText>

            {/* License Number */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                License Number *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter license number"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Issuing Authority */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Issuing Authority
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={issuingAuthority}
                onChangeText={setIssuingAuthority}
                placeholder="e.g., DMV, Transport Department"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Start Date */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                License Issue Date *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD (e.g., 2024-01-15)"
                placeholderTextColor={theme.textMuted}
                maxLength={10}
              />
              <ThemedText style={[styles.dateDisplay, { color: theme.textMuted }]}>
                {formatDateForDisplay(startDate)}
              </ThemedText>
            </View>

            {/* Expire Date */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                License Expiry Date *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={expireDate}
                onChangeText={(text) => {
                  setExpireDate(text);
                  if (text.length === 10 && isValidDate(text)) {
                    setTimeout(() => checkExpirationStatus(text, 'license'), 300);
                  } else {
                    setReminderStatus('');
                  }
                }}
                placeholder="YYYY-MM-DD (e.g., 2025-01-15)"
                placeholderTextColor={theme.textMuted}
                maxLength={10}
              />
              <ThemedText style={[styles.dateDisplay, { color: theme.textMuted }]}>
                {formatDateForDisplay(expireDate)}
              </ThemedText>
            </View>

            {/* Reminder Days */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Reminder Days Before Expiry
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={reminderDays}
                onChangeText={setReminderDays}
                placeholder="30"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveLicenseData}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  Save License Information
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>

          {/* License Quick Actions */}
          <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
              Quick Actions
            </ThemedText>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => saveReminder(getDaysRemaining(expireDate), 'license')}
              disabled={!expireDate || getDaysRemaining(expireDate) === null}
            >
              <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
                Set License Renewal Reminder
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* License Duration Info */}
          {startDate && expireDate && (
            <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                License Duration
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                Total validity: {Math.ceil((new Date(expireDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                From: {formatDateForDisplay(startDate)}
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                To: {formatDateForDisplay(expireDate)}
              </ThemedText>
              {getDaysRemaining(expireDate) !== null && (
                <ThemedText style={[styles.durationText, { color: getStatusColor(reminderStatus), fontWeight: 'bold' }]}>
                  Status: {getDaysRemaining(expireDate) >= 0 ? `${getDaysRemaining(expireDate)} days remaining` : 'EXPIRED'}
                </ThemedText>
              )}
            </ThemedView>
          )}
        </>
      )}

      {/* Insurance Tab Content */}
      {activeTab === 'insurance' && (
        <>
          {/* Insurance Status Display */}
          {insuranceReminderStatus && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(insuranceReminderStatus) }]}>
              <ThemedText style={styles.statusText}>
                {getStatusText(insuranceReminderStatus)}
              </ThemedText>
              {getDaysRemaining(insuranceExpireDate) !== null && getDaysRemaining(insuranceExpireDate) >= 0 && (
                <ThemedText style={styles.daysText}>
                  {getDaysRemaining(insuranceExpireDate)} days remaining
                </ThemedText>
              )}
            </View>
          )}

          {/* Insurance Form */}
          <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
              Insurance Details
            </ThemedText>

            {/* Policy Number */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Policy Number *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={insurancePolicyNumber}
                onChangeText={setInsurancePolicyNumber}
                placeholder="Enter policy number"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Insurance Provider */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Insurance Provider *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                placeholder="e.g., State Farm, Geico, Progressive"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Coverage Type */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Coverage Type
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={coverageType}
                onChangeText={setCoverageType}
                placeholder="e.g., Full Coverage, Liability, Comprehensive"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Premium Amount */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Premium Amount
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={premiumAmount}
                onChangeText={setPremiumAmount}
                placeholder="e.g., $500/year, $50/month"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Insurance Start Date */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Insurance Start Date *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={insuranceStartDate}
                onChangeText={setInsuranceStartDate}
                placeholder="YYYY-MM-DD (e.g., 2024-01-15)"
                placeholderTextColor={theme.textMuted}
                maxLength={10}
              />
              <ThemedText style={[styles.dateDisplay, { color: theme.textMuted }]}>
                {formatDateForDisplay(insuranceStartDate)}
              </ThemedText>
            </View>

            {/* Insurance Expire Date */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Insurance Expiry Date *
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={insuranceExpireDate}
                onChangeText={(text) => {
                  setInsuranceExpireDate(text);
                  if (text.length === 10 && isValidDate(text)) {
                    setTimeout(() => checkExpirationStatus(text, 'insurance'), 300);
                  } else {
                    setInsuranceReminderStatus('');
                  }
                }}
                placeholder="YYYY-MM-DD (e.g., 2025-01-15)"
                placeholderTextColor={theme.textMuted}
                maxLength={10}
              />
              <ThemedText style={[styles.dateDisplay, { color: theme.textMuted }]}>
                {formatDateForDisplay(insuranceExpireDate)}
              </ThemedText>
            </View>

            {/* Insurance Reminder Days */}
            <View style={styles.inputSection}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Reminder Days Before Expiry
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background
                }]}
                value={insuranceReminderDays}
                onChangeText={setInsuranceReminderDays}
                placeholder="30"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Save Insurance Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveInsuranceData}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  Save Insurance Information
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>

          {/* Insurance Quick Actions */}
          <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
              Quick Actions
            </ThemedText>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => saveReminder(getDaysRemaining(insuranceExpireDate), 'insurance')}
              disabled={!insuranceExpireDate || getDaysRemaining(insuranceExpireDate) === null}
            >
              <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
                Set Insurance Renewal Reminder
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Insurance Duration Info */}
          {insuranceStartDate && insuranceExpireDate && (
            <ThemedView style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Insurance Duration
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                Total validity: {Math.ceil((new Date(insuranceExpireDate) - new Date(insuranceStartDate)) / (1000 * 60 * 60 * 24))} days
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                From: {formatDateForDisplay(insuranceStartDate)}
              </ThemedText>
              <ThemedText style={[styles.durationText, { color: theme.textMuted }]}>
                To: {formatDateForDisplay(insuranceExpireDate)}
              </ThemedText>
              {getDaysRemaining(insuranceExpireDate) !== null && (
                <ThemedText style={[styles.durationText, { color: getStatusColor(insuranceReminderStatus), fontWeight: 'bold' }]}>
                  Status: {getDaysRemaining(insuranceExpireDate) >= 0 ? `${getDaysRemaining(insuranceExpireDate)} days remaining` : 'EXPIRED'}
                </ThemedText>
              )}
            </ThemedView>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  vehicleInfo: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleIconContainer: {
    marginRight: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  plateNumber: {
    fontSize: 14,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  licenseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  licenseBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  daysText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  dateDisplay: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 14,
    marginBottom: 4,
  },
});