// auth/signUp.js
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import Colors from '../../constant/Colors';
import { useUser } from '../../context/UserDetailContext';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Get user context for additional functionality
  const { refreshUserDetails } = useUser();

  // Form validation
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
    
    // Basic email validation
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
    console.log("Creating user with:", email);
    
    try {
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      const user = resp.user;
      console.log('User created:', user.uid);
      
      // Save user data to Firestore
      await SaveUser(user);
      
    } catch (error) {
      console.error('❌ Error creating user:', error.code, error.message);
      
      // Provide user-friendly error messages
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
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        member: false,
        uid: user?.uid,
        createdAt: new Date().toISOString(),
        profileComplete: false,
      };
      
      await setDoc(doc(db, 'users', email.toLowerCase().trim()), userData);
      console.log('✅ User saved in Firestore');
      
      // Refresh user details in context
      await refreshUserDetails();
      
      setMessage('Account created successfully! Welcome to SmartAgro!');
      setMessageType('success');
      setModalVisible(true);
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Navigate to home after a short delay
      setTimeout(() => {
        router.push('/homepage');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error saving user:', error.message);
      setMessage('Account created but there was an error saving your profile. Please try signing in.');
      setMessageType('error');
      setModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    // If success message and modal is closing, navigate to home
    if (messageType === 'success') {
      router.push('/homepage');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />
      
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
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]} 
        onPress={CreateNewAccount}
        disabled={isLoading}
      >
        <Text style={styles.buttonPrimaryText}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>Already have an account? </Text>
        <Pressable onPress={() => router.push('/auth/signIn')}>
          <Text style={styles.signInLink}>Sign In</Text>
        </Pressable>
      </View>

      {/* Modal Dialog */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text
              style={[
                styles.modalText,
                messageType === 'success' ? styles.success : styles.error,
              ]}
            >
              {message}
            </Text>
            <TouchableOpacity
              onPress={handleModalClose}
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
  bottomText: {
    fontSize: 16,
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
  modalText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  success: {
    color: '#155724',
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
  },
  error: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
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