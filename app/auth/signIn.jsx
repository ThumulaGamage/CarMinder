// auth/signIn.js
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../config/firebaseConfig';
import Colors from '../../constant/Colors';
import { useUser } from '../../context/UserDetailContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Get user context (optional - for additional functionality)
  const { isAuthenticated } = useUser();

  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      setModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Signed in:', user.email);
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Navigate to home - the UserContext will automatically update
      router.push('/homepage');
    } catch (error) {
      console.error('❌ Sign-in error:', error.code, error.message);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]} 
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomTextContainer}>
        <Text style={styles.buttonSecondaryText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push('/auth/signUp')}>
          <Text style={styles.signInLink}>Create new</Text>
        </Pressable>
      </View>

      {/* Modal Dialog */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.errorText}>{message}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.BLUE_DARK,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    height: 50,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: Colors.BLUE_DARK,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonPrimaryText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonSecondaryText: {
    color: Colors.BLACK,
    fontSize: 16,
    fontWeight: '500',
  },
  signInLink: {
    color: Colors.BLUE,
    fontSize: 16,
    fontWeight: '500',
  },

  // Modal Styles
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: Colors.GREEN_DARK,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  modalButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});