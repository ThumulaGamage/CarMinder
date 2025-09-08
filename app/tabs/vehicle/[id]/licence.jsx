import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
import ThemedText from '../../../../components/ThemedText';
import ThemedView from '../../../../components/ThemedView';
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

export default function LicenceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  // Get vehicle ID from route parameters
  const selectedVehicleId = params.id;

  // State variables
  const [vehicle, setVehicle] = useState(null);
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

  useEffect(() => {
    if (!selectedVehicleId) {
      setLoading(false);
      return;
    }
    loadVehicleData();
  }, [selectedVehicleId]);

  const loadVehicleData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Get vehicle data
      const vehicleDocRef = doc(db, 'users', user.uid, 'vehicles', selectedVehicleId);
      const vehicleSnap = await getDoc(vehicleDocRef);

      if (!vehicleSnap.exists()) {
        setVehicle(null);
        setLoading(false);
        return;
      }

      const vehicleData = { id: vehicleSnap.id, ...vehicleSnap.data() };

      // Get existing license data
      try {
        const licensesRef = collection(db, 'users', user.uid, 'licenses');
        const licenseQuery = query(licensesRef, where('vehicleId', '==', selectedVehicleId));
        const licenseSnap = await getDocs(licenseQuery);

        if (!licenseSnap.empty) {
          const licenseData = licenseSnap.docs[0].data();
          vehicleData.licenseData = licenseData;
          
          // Pre-populate license form
          setStartDate(licenseData.startDate || '');
          setExpireDate(licenseData.expireDate || '');
          setLicenseNumber(licenseData.licenseNumber || '');
          setIssuingAuthority(licenseData.issuingAuthority || '');
          setReminderDays(licenseData.reminderDays || '30');

          if (licenseData.expireDate) {
            checkExpirationStatus(licenseData.expireDate, 'license');
          }
        }
      } catch (error) {
        console.log('No license data found');
      }

      // Get existing insurance data
      try {
        const insuranceRef = collection(db, 'users', user.uid, 'insurance');
        const insuranceQuery = query(insuranceRef, where('vehicleId', '==', selectedVehicleId));
        const insuranceSnap = await getDocs(insuranceQuery);

        if (!insuranceSnap.empty) {
          const insuranceData = insuranceSnap.docs[0].data();
          vehicleData.insuranceData = insuranceData;

          // Pre-populate insurance form
          setInsuranceStartDate(insuranceData.startDate || '');
          setInsuranceExpireDate(insuranceData.expireDate || '');
          setInsurancePolicyNumber(insuranceData.policyNumber || '');
          setInsuranceProvider(insuranceData.provider || '');
          setInsuranceReminderDays(insuranceData.reminderDays || '30');
          setCoverageType(insuranceData.coverageType || '');
          setPremiumAmount(insuranceData.premiumAmount || '');

          if (insuranceData.expireDate) {
            checkExpirationStatus(insuranceData.expireDate, 'insurance');
          }
        }
      } catch (error) {
        console.log('No insurance data found');
      }

      setVehicle(vehicleData);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle data: ' + error.message);
    } finally {
      setLoading(false);
    }
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
    if (!vehicle) {
      Alert.alert('Error', 'Vehicle data not found.');
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
    if (!vehicle) {
      Alert.alert('Error', 'Vehicle data not found.');
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
        vehicleId: vehicle.id,
        userId: userId,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        plateNumber: vehicle.plate
      };

      const licenseDocRef = doc(db, 'users', userId, 'licenses', vehicle.id);
      await setDoc(licenseDocRef, licenseData);

      Alert.alert('Success', 'License information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            loadVehicleData(); // Refresh data
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
        vehicleId: vehicle.id,
        userId: userId,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        plateNumber: vehicle.plate
      };

      const insuranceDocRef = doc(db, 'users', userId, 'insurance', vehicle.id);
      await setDoc(insuranceDocRef, insuranceData);

      Alert.alert('Success', 'Insurance information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            loadVehicleData(); // Refresh data
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
      if (!userId || !vehicle) return;

      const reminderData = {
        vehicleId: vehicle.id,
        type: type === 'license' ? 'license_expiry' : 'insurance_expiry',
        message: `${type === 'license' ? 'License' : 'Insurance'} expires in ${daysRemaining} days`,
        daysRemaining: daysRemaining,
        expireDate: type === 'license' ? expireDate : insuranceExpireDate,
        createdAt: new Date().toISOString(),
        isActive: true,
        vehicleName: `${vehicle.brand} ${vehicle.model}`
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.text }]}>
            Loading vehicle data...
          </ThemedText>
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
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Vehicle Header Section */}
        <LinearGradient
          colors={[theme.primary + '20', theme.background]}
          style={styles.vehicleHeader}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons
              name={getVehicleIcon(vehicle.type)}
              size={60}
              color={theme.primary}
            />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={[styles.modelName, { color: theme.text }]}>
              {vehicle.brand} {vehicle.model}
            </Text>
            <Text style={[styles.plateText, { color: theme.textMuted }]}>
              {vehicle.plate}
            </Text>
          </View>
        </LinearGradient>

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
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
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
  vehicleHeader: {
    padding: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  vehicleInfo: {
    alignItems: 'center',
  },
  modelName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  plateText: {
    fontSize: 16,
    fontWeight: '500',
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
});