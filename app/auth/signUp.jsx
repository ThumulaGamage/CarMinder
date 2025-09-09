import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import { useUser } from '../../context/UserDetailContext';
import useTheme from '../../Theme/theme';

// Themed Components
import ThemedButton from '../../components/ThemedButton';
import ThemedText from '../../components/ThemedText';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedView from '../../components/ThemedView';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const theme = useTheme();
  const { refreshUserDetails, user, isAuthenticated, loading } = useUser();

  // Debug: Monitor auth state changes
  useEffect(() => {
    console.log('🔍 SignUp - Auth State Debug:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      loading
    });

    // If user becomes authenticated while on sign up page, redirect
    if (isAuthenticated && user && !loading) {
      console.log('🚀 SignUp - Auto-redirecting to homepage...');
      router.replace('/homepage');
    }
  }, [isAuthenticated, user, loading, router]);

  const validateForm = () => {
    if (!name.trim()) {
      setMessage('Please enter your full name');
      setMessageType('error');
      setModalVisible(true);
      return false;
    }
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      setModalVisible(true);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      setModalVisible(true);
      return false;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      setModalVisible(true);
      return false;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      setModalVisible(true);
      return false;
    }
    return true;
  };

  const CreateNewAccount = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔐 Starting account creation process...');
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      const user = resp.user;
      console.log('✅ Firebase account created successfully:', user.email);
      await SaveUser(user);
    } catch (error) {
      console.log('❌ Account creation error:', error.code, error.message);
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      setMessage(errorMessage);
      setMessageType('error');
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const SaveUser = async (user) => {
    try {
      if (!user || !user.uid) throw new Error('Invalid user object or missing UID');
      
      console.log('💾 Saving user data to Firestore...');
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        member: false,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        profileComplete: false,
        lastLoginAt: new Date().toISOString(),
        accountStatus: 'active',
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ User data saved successfully');
      
      await refreshUserDetails();
      console.log('✅ User details refreshed');

      setMessage('Account created successfully! Redirecting...');
      setMessageType('success');
      setModalVisible(true);

      // Clear form fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Wait a moment for UserDetailContext to update, then navigate manually
      console.log('⏳ Waiting for auth state to update...');
      setTimeout(() => {
        console.log('🚀 Manual navigation to homepage...');
        router.replace('/homepage');
      }, 1500); // Give UserDetailContext time to update
      
    } catch (error) {
      console.error('❌ Error saving user:', error.message);
      setMessage('Account created but error saving profile. Please sign in.');
      setMessageType('error');
      setModalVisible(true);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.formContainer}>
          <ThemedText style={[styles.title, { color: theme.primary }]}>Create Account</ThemedText>

          {/* Debug info 
          <View style={styles.debugContainer}>
            <ThemedText style={styles.debugText}>
              Auth Status: {isAuthenticated ? '✅ Signed In' : '❌ Not Signed In'}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Loading: {loading ? 'Yes' : 'No'}
            </ThemedText>
            {user && (
              <ThemedText style={styles.debugText}>
                User: {user.email}
              </ThemedText>
            )}
          </View>*/}

          <ThemedTextInput 
            placeholder="Full Name" 
            value={name} 
            onChangeText={setName} 
            editable={!isLoading}
            style={styles.input}
          />
          
          <ThemedTextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            style={styles.input}
          />
          
          {/* Password Field with Toggle */}
          <View style={styles.passwordContainer}>
            <ThemedTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={togglePasswordVisibility}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.text || '#666'}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Field with Toggle */}
          <View style={styles.passwordContainer}>
            <ThemedTextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={toggleConfirmPasswordVisibility}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.text || '#666'}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.passwordStrength}>
              <ThemedText style={[
                styles.strengthText,
                { color: password.length >= 6 ? '#4CAF50' : '#FF9800' }
              ]}>
                {password.length >= 6 ? '✓ Password meets requirements' : '⚠ Password must be at least 6 characters'}
              </ThemedText>
            </View>
          )}

          <ThemedButton
            title={isLoading ? 'Creating Account...' : 'Sign Up'}
            onPress={CreateNewAccount}
            style={[styles.button, isLoading && { backgroundColor: '#aaa' }]}
            disabled={isLoading}
          />

          {/* Debug navigation button */}
          {isAuthenticated && user && (
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                console.log('🔧 Debug: Manual navigation to homepage');
                router.replace('/homepage');
              }}
            >
              <ThemedText style={styles.debugButtonText}>
                Go to Homepage (Debug)
              </ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.bottomTextContainer}>
            <ThemedText style={styles.buttonSecondaryText}>Already have an account? </ThemedText>
            <Pressable onPress={() => router.push('/auth/signIn')}>
              <ThemedText style={[styles.signInLink, { color: theme.primary }]}>Sign In</ThemedText>
            </Pressable>
          </View>

          {modalVisible && (
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
                <ThemedText
                  style={[
                    styles.modalText,
                    messageType === 'success' ? { color: '#155724' } : { color: '#721c24' },
                  ]}
                >
                  {message}
                </ThemedText>
                <ThemedButton
                  title="OK"
                  onPress={handleModalClose}
                  style={{ backgroundColor: theme.primary, width: 100 }}
                />
              </View>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  input: {
    borderRadius: 10,
    marginBottom: 12,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50, // Make space for eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 5,
  },
  passwordStrength: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  debugButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
});