import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { useUser } from '../../context/UserDetailContext';
import useTheme from '../../Theme/theme';

import ThemedButton from '../../components/ThemedButton';
import ThemedText from '../../components/ThemedText';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedView from '../../components/ThemedView';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const theme = useTheme();
  const { user, isAuthenticated, loading } = useUser();

  // Debug: Monitor auth state changes
  useEffect(() => {
    console.log('🔍 SignIn - Auth State Debug:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      loading
    });

    // If user becomes authenticated while on sign in page, redirect
    if (isAuthenticated && user && !loading) {
      console.log('🚀 SignIn - Auto-redirecting to homepage...');
      router.replace('/homepage');
    }
  }, [isAuthenticated, user, loading, router]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      setModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting sign in process...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase sign in successful:', user.email);
      
      // Clear form fields
      setEmail('');
      setPassword('');
      
      // Wait a moment for UserDetailContext to update, then navigate manually
      console.log('⏳ Waiting for auth state to update...');
      setTimeout(() => {
        console.log('🚀 Manual navigation to homepage...');
        router.replace('/homepage');
      }, 1000); // Give UserDetailContext time to update
      
    } catch (error) {
      console.log('❌ Sign in error:', error.code, error.message);
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      setMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.primary }]}>Welcome Back</ThemedText>
      <ThemedText style={styles.subtitle}>Please sign in to continue</ThemedText>

      {/* Debug info */}
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
      </View>

      <ThemedTextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        style={styles.input}
      />

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

      <ThemedButton
        title={isLoading ? 'Signing In...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.buttonDisabled]}
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
        <ThemedText style={styles.bottomText}>Don't have an account? </ThemedText>
        <Pressable onPress={() => router.push('/auth/signUp')}>
          <ThemedText style={[styles.signInLink, { color: theme.primary }]}>Create new</ThemedText>
        </Pressable>
      </View>

      {/* Modal Dialog */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.modalText, { color: theme.error || '#D32F2F' }]}>
              {message}
            </ThemedText>
            <ThemedButton
              title="OK"
              onPress={() => setModalVisible(false)}
              style={{ backgroundColor: theme.primary, width: 100 }}
            />
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    marginBottom: 24,
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
  button: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
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
  bottomText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
});