import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, // Added missing import
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import useTheme from '../../Theme/theme';
import ThemedText from '../../components/ThemedText';
import { useUser } from '../../context/UserDetailContext';

// Separate SecurityModal into its own component for better organization
const SecurityModal = ({ visible, onClose, theme, user }) => {
  const [securityTab, setSecurityTab] = useState('email');
  const [emailForm, setEmailForm] = useState({
    currentEmail: user?.email || '',
    newEmail: '',
    confirmEmail: '',
    password: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoized validation functions
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  }, []);

  const isEmailFormValid = useMemo(() => {
    return (
      validateEmail(emailForm.newEmail) &&
      emailForm.newEmail === emailForm.confirmEmail &&
      emailForm.newEmail !== emailForm.currentEmail &&
      emailForm.password.length > 0
    );
  }, [emailForm, validateEmail]);

  const isPasswordFormValid = useMemo(() => {
    const validation = validatePassword(passwordForm.newPassword);
    return (
      Object.values(validation).every(Boolean) &&
      passwordForm.newPassword === passwordForm.confirmPassword &&
      passwordForm.currentPassword.length > 0 &&
      passwordForm.newPassword !== passwordForm.currentPassword
    );
  }, [passwordForm, validatePassword]);

  const resetForms = useCallback(() => {
    setEmailForm({
      currentEmail: user?.email || '',
      newEmail: '',
      confirmEmail: '',
      password: ''
    });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  }, [user?.email]);

  const handleClose = useCallback(() => {
    resetForms();
    setSecurityTab('email');
    onClose();
  }, [resetForms, onClose]);

  const handleUpdateEmail = useCallback(async () => {
    if (!isEmailFormValid) {
      Alert.alert("Error", "Please check all fields");
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        "Success", 
        "Email updated successfully. Please check your new email for verification.",
        [{ text: "OK", onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update email. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [isEmailFormValid, handleClose]);

  const handleUpdatePassword = useCallback(async () => {
    if (!isPasswordFormValid) {
      Alert.alert("Error", "Please check all fields");
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        "Success", 
        "Password updated successfully",
        [{ text: "OK", onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [isPasswordFormValid, handleClose]);

  const EmailForm = () => (
    <View style={styles.formContainer}>
      <ThemedText style={[styles.formTitle, { color: theme.text }]}>
        Update Email Address
      </ThemedText>
      <ThemedText style={[styles.formDescription, { color: theme.secondaryText }]}>
        You'll need to verify your new email address after updating.
      </ThemedText>

      {/* Current Email */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
          Current Email
        </ThemedText>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground || '#F5F5F5' }]}>
          <Ionicons name="mail-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.secondaryText }]}
            value={emailForm.currentEmail}
            editable={false}
            placeholder="Current email"
            placeholderTextColor={theme.secondaryText || '#666'}
            accessibilityLabel="Current email address (read-only)"
          />
        </View>
      </View>

      {/* New Email */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
          New Email Address
        </ThemedText>
        <View style={[
          styles.inputContainer, 
          { 
            borderColor: emailForm.newEmail && !validateEmail(emailForm.newEmail) 
              ? '#EF4444' 
              : theme.border || '#E5E5E5' 
          }
        ]}>
          <Ionicons name="mail-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={emailForm.newEmail}
            onChangeText={(text) => setEmailForm({...emailForm, newEmail: text})}
            placeholder="Enter new email"
            placeholderTextColor={theme.secondaryText || '#666'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="New email address"
          />
          {emailForm.newEmail && validateEmail(emailForm.newEmail) && (
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={styles.validationIcon} />
          )}
        </View>
        {emailForm.newEmail && !validateEmail(emailForm.newEmail) && (
          <ThemedText style={[styles.errorText, { color: '#EF4444' }]}>
            Please enter a valid email address
          </ThemedText>
        )}
      </View>

      {/* Confirm Email */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
          Confirm New Email
        </ThemedText>
        <View style={[
          styles.inputContainer, 
          { 
            borderColor: emailForm.confirmEmail && emailForm.newEmail !== emailForm.confirmEmail 
              ? '#EF4444' 
              : theme.border || '#E5E5E5' 
          }
        ]}>
          <Ionicons name="mail-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={emailForm.confirmEmail}
            onChangeText={(text) => setEmailForm({...emailForm, confirmEmail: text})}
            placeholder="Confirm new email"
            placeholderTextColor={theme.secondaryText || '#666'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Confirm new email address"
          />
          {emailForm.confirmEmail && emailForm.newEmail === emailForm.confirmEmail && (
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={styles.validationIcon} />
          )}
        </View>
        {emailForm.confirmEmail && emailForm.newEmail !== emailForm.confirmEmail && (
          <ThemedText style={[styles.errorText, { color: '#EF4444' }]}>
            Email addresses don't match
          </ThemedText>
        )}
      </View>

      {/* Current Password */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
          Current Password
        </ThemedText>
        <View style={[styles.inputContainer, { borderColor: theme.border || '#E5E5E5' }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={emailForm.password}
            onChangeText={(text) => setEmailForm({...emailForm, password: text})}
            placeholder="Enter current password"
            placeholderTextColor={theme.secondaryText || '#666'}
            secureTextEntry={!showPasswords.current}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Current password for email change"
          />
          <TouchableOpacity
            onPress={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
            style={styles.eyeIcon}
            accessibilityLabel={showPasswords.current ? "Hide password" : "Show password"}
            accessibilityRole="button"
          >
            <Ionicons 
              name={showPasswords.current ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={theme.secondaryText} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.updateButton,
          { 
            backgroundColor: isEmailFormValid ? theme.primary || '#007AFF' : theme.secondaryText || '#999',
            opacity: isEmailFormValid ? 1 : 0.6
          },
          isUpdating && styles.updateButtonDisabled
        ]}
        onPress={handleUpdateEmail}
        disabled={isUpdating || !isEmailFormValid}
        accessibilityLabel="Update email address"
        accessibilityRole="button"
        accessibilityState={{ disabled: isUpdating || !isEmailFormValid }}
      >
        {isUpdating ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingSpinner} />
            <ThemedText style={styles.updateButtonText}>Updating...</ThemedText>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.updateButtonText}>Update Email</ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const PasswordForm = () => {
    const passwordValidation = useMemo(() => validatePassword(passwordForm.newPassword), [passwordForm.newPassword, validatePassword]);

    return (
      <View style={styles.formContainer}>
        <ThemedText style={[styles.formTitle, { color: theme.text }]}>
          Change Password
        </ThemedText>
        <ThemedText style={[styles.formDescription, { color: theme.secondaryText }]}>
          Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
        </ThemedText>

        {/* Current Password */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
            Current Password
          </ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border || '#E5E5E5' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
              placeholder="Enter current password"
              placeholderTextColor={theme.secondaryText || '#666'}
              secureTextEntry={!showPasswords.current}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Current password"
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
              style={styles.eyeIcon}
              accessibilityLabel={showPasswords.current ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              <Ionicons 
                name={showPasswords.current ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
            New Password
          </ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border || '#E5E5E5' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
              placeholder="Enter new password"
              placeholderTextColor={theme.secondaryText || '#666'}
              secureTextEntry={!showPasswords.new}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="New password"
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
              style={styles.eyeIcon}
              accessibilityLabel={showPasswords.new ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              <Ionicons 
                name={showPasswords.new ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.text }]}>
            Confirm New Password
          </ThemedText>
          <View style={[
            styles.inputContainer, 
            { 
              borderColor: passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword 
                ? '#EF4444' 
                : theme.border || '#E5E5E5' 
            }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
              placeholder="Confirm new password"
              placeholderTextColor={theme.secondaryText || '#666'}
              secureTextEntry={!showPasswords.confirm}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Confirm new password"
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
              style={styles.eyeIcon}
              accessibilityLabel={showPasswords.confirm ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              <Ionicons 
                name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={styles.confirmIcon} />
            )}
          </View>
          {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
            <ThemedText style={[styles.errorText, { color: '#EF4444' }]}>
              Passwords don't match
            </ThemedText>
          )}
        </View>

        {/* Password Requirements */}
        <View style={styles.passwordRequirements}>
          <ThemedText style={[styles.requirementsTitle, { color: theme.text }]}>
            Password Requirements:
          </ThemedText>
          {[
            { key: 'length', text: 'At least 8 characters' },
            { key: 'uppercase', text: 'One uppercase letter' },
            { key: 'lowercase', text: 'One lowercase letter' },
            { key: 'number', text: 'One number' },
            { key: 'special', text: 'One special character' }
          ].map(({ key, text }) => (
            <View key={key} style={styles.requirementItem}>
              <Ionicons 
                name={passwordValidation[key] ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={passwordValidation[key] ? "#22C55E" : theme.secondaryText} 
              />
              <ThemedText style={[
                styles.requirementText, 
                { color: passwordValidation[key] ? "#22C55E" : theme.secondaryText }
              ]}>
                {text}
              </ThemedText>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.updateButton,
            { 
              backgroundColor: isPasswordFormValid ? theme.primary || '#007AFF' : theme.secondaryText || '#999',
              opacity: isPasswordFormValid ? 1 : 0.6
            },
            isUpdating && styles.updateButtonDisabled
          ]}
          onPress={handleUpdatePassword}
          disabled={isUpdating || !isPasswordFormValid}
          accessibilityLabel="Update password"
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdating || !isPasswordFormValid }}
        >
          {isUpdating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingSpinner} />
              <ThemedText style={styles.updateButtonText}>Updating...</ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.updateButtonText}>Update Password</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.securityModalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
              <View style={styles.securityModalHeader}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  Security & Privacy
                </ThemedText>
                <TouchableOpacity 
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close security modal"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Tab Selector */}
              <View style={[styles.tabContainer, { borderBottomColor: theme.border || 'rgba(0,0,0,0.1)' }]}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    securityTab === 'email' && { borderBottomColor: theme.primary || '#007AFF' }
                  ]}
                  onPress={() => setSecurityTab('email')}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: securityTab === 'email' }}
                  accessibilityLabel="Email settings tab"
                >
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={securityTab === 'email' ? theme.primary || '#007AFF' : theme.secondaryText || '#666'} 
                  />
                  <ThemedText style={[
                    styles.tabText,
                    { color: securityTab === 'email' ? theme.primary || '#007AFF' : theme.secondaryText || '#666' }
                  ]}>
                    Email
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    securityTab === 'password' && { borderBottomColor: theme.primary || '#007AFF' }
                  ]}
                  onPress={() => setSecurityTab('password')}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: securityTab === 'password' }}
                  accessibilityLabel="Password settings tab"
                >
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={securityTab === 'password' ? theme.primary || '#007AFF' : theme.secondaryText || '#666'} 
                  />
                  <ThemedText style={[
                    styles.tabText,
                    { color: securityTab === 'password' ? theme.primary || '#007AFF' : theme.secondaryText || '#666' }
                  ]}>
                    Password
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.securityContent} showsVerticalScrollIndicator={false}>
                {securityTab === 'email' ? <EmailForm /> : <PasswordForm />}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function SettingsTab() {
  const router = useRouter();
  const theme = useTheme();
  const { user, userDetails } = useUser();

  // State for toggle settings
  const [notifications, setNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  // Current selections
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTheme, setSelectedTheme] = useState('System');
  
  // Modal states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Theme options
  const themeOptions = [
    { id: 'light', name: 'Light', icon: 'sunny-outline' },
    { id: 'dark', name: 'Dark', icon: 'moon-outline' },
    { id: 'system', name: 'System', icon: 'phone-portrait-outline' }
  ];

  // Language options
  const languageOptions = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'it', name: 'Italiano', flag: '🇮🇹' },
    { id: 'pt', name: 'Português', flag: '🇵🇹' },
    { id: 'zh', name: '中文', flag: '🇨🇳' },
    { id: 'ja', name: '日本語', flag: '🇯🇵' },
    { id: 'ko', name: '한국어', flag: '🇰🇷' },
    { id: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const getInitials = useCallback(() => {
    if (!userDetails?.name) return user?.email?.charAt(0).toUpperCase() || '?';
    const names = userDetails.name.split(' ');
    return names.map(name => name[0]).join('').toUpperCase().substring(0, 2);
  }, [userDetails?.name, user?.email]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            console.log("User logged out");
          }
        }
      ]
    );
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", "Cache cleared successfully");
          }
        }
      ]
    );
  }, []);

  const handleThemeSelection = useCallback((themeName) => {
    setSelectedTheme(themeName);
    setShowThemeModal(false);
    console.log(`Theme changed to: ${themeName}`);
  }, []);

  const handleLanguageSelection = useCallback((languageName) => {
    setSelectedLanguage(languageName);
    setShowLanguageModal(false);
    console.log(`Language changed to: ${languageName}`);
  }, []);

  const settingsSections = useMemo(() => [
    {
      title: "Account",
      items: [
        {
          title: "Profile Information",
          icon: <Ionicons name="person-outline" size={22} color={theme.icon || theme.text} />,
          action: () => setShowProfileModal(true),
          type: 'navigation'
        },
        {
          title: "Security & Privacy",
          icon: <MaterialIcons name="security" size={22} color={theme.icon || theme.text} />,
          action: () => setShowSecurityModal(true),
          type: 'navigation'
        },
        {
          title: "Biometric Authentication",
          icon: <Ionicons name="finger-print-outline" size={22} color={theme.icon || theme.text} />,
          type: 'toggle',
          value: biometricAuth,
          onToggle: setBiometricAuth
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          title: "Push Notifications",
          icon: <Ionicons name="notifications-outline" size={22} color={theme.icon || theme.text} />,
          type: 'toggle',
          value: pushNotifications,
          onToggle: setPushNotifications
        },
        {
          title: "Email Notifications",
          icon: <Ionicons name="mail-outline" size={22} color={theme.icon || theme.text} />,
          type: 'toggle',
          value: emailNotifications,
          onToggle: setEmailNotifications
        }
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          title: "Theme",
          subtitle: selectedTheme,
          icon: <Feather name="moon" size={22} color={theme.icon || theme.text} />,
          action: () => setShowThemeModal(true),
          type: 'selection'
        },
        {
          title: "Language",
          subtitle: selectedLanguage,
          icon: <Ionicons name="language-outline" size={22} color={theme.icon || theme.text} />,
          action: () => setShowLanguageModal(true),
          type: 'selection'
        },
      ]
    },
    {
      title: "Storage & Data",
      items: [
        {
          title: "Storage Usage",
          icon: <Ionicons name="pie-chart-outline" size={22} color={theme.icon || theme.text} />,
          action: () => router.push('/account/storage'),
          type: 'navigation'
        },
        {
          title: "Clear Cache",
          icon: <Ionicons name="trash-outline" size={22} color={theme.icon || theme.text} />,
          action: handleClearCache,
          type: 'action'
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          title: "Help Center",
          icon: <Ionicons name="help-circle-outline" size={22} color={theme.icon || theme.text} />,
          action: () => router.push('/account/help'),
          type: 'navigation'
        },
        {
          title: "Contact Support",
          icon: <FontAwesome name="headphones" size={22} color={theme.icon || theme.text} />,
          action: () => router.push('/account/contact'),
          type: 'navigation'
        },
        {
          title: "About",
          icon: <Ionicons name="information-circle-outline" size={22} color={theme.icon || theme.text} />,
          action: () => router.push('/account/about'),
          type: 'navigation'
        }
      ]
    },
    {
      title: "Account Management",
      items: [
        {
          title: "Sign Out",
          icon: <Ionicons name="log-out-outline" size={22} color="#FF3B30" />,
          action: handleLogout,
          type: 'action',
          textColor: "#FF3B30"
        }
      ]
    }
  ], [theme, selectedTheme, selectedLanguage, biometricAuth, pushNotifications, emailNotifications, router, handleClearCache, handleLogout]);

  const renderSettingItem = useCallback((item, itemIndex, sectionItemsLength) => {
    const isLastItem = itemIndex === sectionItemsLength - 1;
    
    return (
      <TouchableOpacity
        key={itemIndex}
        onPress={item.type === 'toggle' ? undefined : item.action}
        style={[
          styles.optionItem,
          !isLastItem && { 
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border || 'rgba(0,0,0,0.1)'
          }
        ]}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.optionIcon}>
          {item.icon}
        </View>
        
        <View style={styles.optionContent}>
          <ThemedText style={[
            styles.optionText, 
            { color: item.textColor || theme.text }
          ]}>
            {item.title}
          </ThemedText>
          {item.subtitle && (
            <ThemedText style={[styles.optionSubtitle, { color: theme.secondaryText || '#666' }]}>
              {item.subtitle}
            </ThemedText>
          )}
        </View>

        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E5E5EA', true: theme.primary || '#007AFF' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E5EA"
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={theme.secondaryText || '#999'} 
            style={styles.optionChevron}
          />
        )}
      </TouchableOpacity>
    );
  }, [theme]);

  const renderThemeOption = useCallback(({ item }) => {
    const isSelected = selectedTheme.toLowerCase() === item.name.toLowerCase();
    
    return (
      <TouchableOpacity
        style={[
          styles.modalOption,
          isSelected && {
            backgroundColor: theme.primary ? `${theme.primary}20` : 'rgba(0, 122, 255, 0.2)'
          }
        ]}
        onPress={() => handleThemeSelection(item.name)}
      >
        <Ionicons 
          name={item.icon} 
          size={22} 
          color={theme.icon || theme.text} 
          style={styles.modalOptionIcon}
        />
        <ThemedText style={[styles.modalOptionText, { color: theme.text }]}>
          {item.name}
        </ThemedText>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={theme.primary || '#007AFF'} />
        )}
      </TouchableOpacity>
    );
  }, [selectedTheme, theme, handleThemeSelection]);

  const renderLanguageOption = useCallback(({ item }) => {
    const isSelected = selectedLanguage === item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.modalOption,
          isSelected && {
            backgroundColor: theme.primary ? `${theme.primary}20` : 'rgba(0, 122, 255, 0.2)'
          }
        ]}
        onPress={() => handleLanguageSelection(item.name)}
      >
        <ThemedText style={styles.modalOptionFlag}>
          {item.flag}
        </ThemedText>
        <ThemedText style={[styles.modalOptionText, { color: theme.text }]}>
          {item.name}
        </ThemedText>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={theme.primary || '#007AFF'} />
        )}
      </TouchableOpacity>
    );
  }, [selectedLanguage, theme, handleLanguageSelection]);

  const ProfileInfoModal = () => (
    <Modal
      visible={showProfileModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProfileModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.profileModalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
              <View style={styles.profileModalHeader}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  Profile Information
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => setShowProfileModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={styles.profileContent}>
                {/* Profile Picture Section */}
                <View style={styles.profilePictureSection}>
                  {userDetails?.profilePicture ? (
                    <Image 
                      source={{ uri: userDetails.profilePicture }} 
                      style={styles.profileModalImage}
                    />
                  ) : (
                    <View style={[styles.profileModalIcon, { backgroundColor: theme.primary }]}>
                      <ThemedText style={styles.profileModalInitials}>{getInitials()}</ThemedText>
                    </View>
                  )}
                  <ThemedText style={[styles.profileModalName, { color: theme.text }]}>
                    {userDetails?.name || 'User'}
                  </ThemedText>
                </View>

                {/* Account Details */}
                <View style={styles.profileDetailsSection}>
                  {[
                    { icon: 'person-outline', label: 'Full Name', value: userDetails?.name || 'Not provided' },
                    { icon: 'mail-outline', label: 'Email Address', value: user?.email || 'Not provided' },
                    { 
                      icon: 'calendar-outline', 
                      label: 'Member Since', 
                      value: userDetails?.createdAt 
                        ? new Date(userDetails.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown'
                    },
                    { icon: 'shield-checkmark-outline', label: 'Account Status', value: 'Active', valueColor: '#22C55E' },
                    { icon: 'key-outline', label: 'User ID', value: user?.uid?.substring(0, 8) + '...' || 'Unknown', fontSize: 14 },
                    { 
                      icon: 'time-outline', 
                      label: 'Last Updated', 
                      value: userDetails?.updatedAt 
                        ? new Date(userDetails.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Unknown'
                    }
                  ].map((item, index) => (
                    <View key={index} style={styles.profileDetailRow}>
                      <View style={styles.profileDetailIcon}>
                        <Ionicons name={item.icon} size={20} color={theme.primary} />
                      </View>
                      <View style={styles.profileDetailContent}>
                        <ThemedText style={[styles.profileDetailLabel, { color: theme.secondaryText }]}>
                          {item.label}
                        </ThemedText>
                        <ThemedText style={[
                          styles.profileDetailValue, 
                          { 
                            color: item.valueColor || theme.text,
                            fontSize: item.fontSize || 16
                          }
                        ]}>
                          {item.value}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>

                
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.safeArea, { paddingTop: 30 }]}></SafeAreaView>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border || 'rgba(0,0,0,0.05)' }]}>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </ThemedText>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText || '#666' }]}>
              {section.title}
            </ThemedText>
            
            <View style={[styles.sectionItems, { backgroundColor: theme.card || '#FFFFFF' }]}>
              {section.items.map((item, itemIndex) => 
                renderSettingItem(item, itemIndex, section.items.length)
              )}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.versionText, { color: theme.secondaryText || '#666' }]}>
            v1.2.8 • Build 428
          </ThemedText>
          <ThemedText style={[styles.copyrightText, { color: theme.secondaryText || '#666' }]}>
            © 2024 YourApp Inc.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Profile Information Modal */}
      <ProfileInfoModal />

      {/* Security Modal */}
      <SecurityModal 
        visible={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
        theme={theme} 
        user={user} 
      />

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Choose Theme
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setShowThemeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={themeOptions}
              keyExtractor={(item) => item.id}
              renderItem={renderThemeOption}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.languageModal, { backgroundColor: theme.card || '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Choose Language
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.id}
              renderItem={renderLanguageOption}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionItems: {
    borderRadius: 12,
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  optionIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '400',
  },
  optionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  optionChevron: {
    marginLeft: 8,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
  // Modal Styles - Unified and corrected
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    width: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: 20,
  },
  languageModal: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 56,
  },
  modalOptionIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  modalOptionFlag: {
    marginRight: 16,
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
  },
  // Profile Modal Styles
  profileModalContent: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileContent: {
    padding: 20,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileModalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileModalInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileDetailsSection: {
    marginBottom: 24,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  profileDetailIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  profileDetailContent: {
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileDetailValue: {
    fontSize: 16,
    fontWeight: '400',
  },

  // Security Modal Styles - Fixed and corrected
  securityModalContent: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  securityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  securityContent: {
    flex: 1,
    paddingVertical: 4,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 24,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  validationIcon: {
    marginLeft: 8,
  },
  confirmIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSpinner: {
    marginRight: 4,
  },
  passwordRequirements: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
  },
});