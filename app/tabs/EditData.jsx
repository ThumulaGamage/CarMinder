import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../config/firebaseConfig';
import { useUser } from '../../context/UserDetailContext';
import useTheme from '../../Theme/theme';

import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';

export default function EditProfile() {
  const { user, userDetails, refreshUserDetails } = useUser();
  const router = useRouter();
  const theme = useTheme();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Track what fields have changed
  const [nameChanged, setNameChanged] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Initialize form values
  useEffect(() => {
    setName(userDetails?.name || '');
    setEmail(user?.email || '');
  }, [userDetails, user]);

  // Track changes
  useEffect(() => {
    setNameChanged(name !== (userDetails?.name || ''));
  }, [name, userDetails?.name]);

  useEffect(() => {
    setEmailChanged(email !== (user?.email || ''));
  }, [email, user?.email]);

  useEffect(() => {
    setPasswordChanged(newPassword.length > 0 || confirmPassword.length > 0);
  }, [newPassword, confirmPassword]);

  const validateForm = () => {
    // Name validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    // Email validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation if changing password
    if (passwordChanged) {
      if (!currentPassword) {
        Alert.alert('Error', 'Please enter your current password');
        return false;
      }

      if (newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters long');
        return false;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return false;
      }
    }

    // Require current password for email changes
    if (emailChanged && !currentPassword) {
      Alert.alert('Error', 'Please enter your current password to change email');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check if anything actually changed
    if (!nameChanged && !emailChanged && !passwordChanged) {
      Alert.alert('No Changes', 'No changes were made to save');
      return;
    }

    setLoading(true);
    try {
      // Update user data in Firestore
      const updateData = {
        updatedAt: new Date().toISOString(),
      };

      if (nameChanged) {
        updateData.name = name.trim();
      }

      if (emailChanged) {
        updateData.email = email.trim().toLowerCase();
      }

      await db.collection('users').doc(user.uid).update(updateData);

      // Note: In a real app, you would also update Firebase Auth email and password
      // This would require re-authentication with current password
      
      await refreshUserDetails();
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (nameChanged || emailChanged || passwordChanged) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const InputSection = ({ title, children }) => (
    <View style={[styles.inputSection, { backgroundColor: theme.card }]}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{title}</ThemedText>
      {children}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, required, changed }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
          {label}
          {required && <ThemedText style={styles.required}> *</ThemedText>}
        </ThemedText>
        {changed && (
          <View style={[styles.changedIndicator, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.changedText}>Modified</ThemedText>
          </View>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: changed ? theme.primary : theme.border,
            borderWidth: changed ? 2 : 1,
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        returnKeyType="next"
        blurOnSubmit={false}
      />
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}


        <View style={[styles.header, { 
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
             paddingVertical: 16, // space inside the header
      paddingHorizontal: 20, // left & right padding
      marginTop: 30,
        }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Edit Profile
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: (nameChanged || emailChanged || passwordChanged) ? theme.primary : theme.textMuted,
                opacity: loading ? 0.5 : 1 
              }
            ]}
            onPress={handleSave}
            disabled={loading || (!nameChanged && !emailChanged && !passwordChanged)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Personal Information */}
            <InputSection title="Personal Information">
              <InputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                required={true}
                changed={nameChanged}
              />
              
              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                required={true}
                changed={emailChanged}
              />
            </InputSection>

            {/* Change Password */}
            <InputSection title="Change Password">
              <ThemedText style={[styles.sectionDescription, { color: theme.textMuted }]}>
                Leave blank if you don't want to change your password
              </ThemedText>
              
              <InputField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={true}
                required={emailChanged || passwordChanged}
              />
              
              <InputField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                secureTextEntry={true}
                changed={passwordChanged}
              />
              
              <InputField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={true}
                changed={passwordChanged}
              />
            </InputSection>

            {/* Information Notes */}
            <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
                  Current password is required when changing email or password
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
                  Password must be at least 6 characters long
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 25,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    margin: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  inputSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
  },
  changedIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
    fontWeight: '500',
  },
  infoSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});