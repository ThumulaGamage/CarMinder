import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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

  const router = useRouter();
  const theme = useTheme();
  const { refreshUserDetails } = useUser();

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
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      const user = resp.user;
      await SaveUser(user);
    } catch (error) {
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
      await refreshUserDetails();

      setMessage('Account created successfully!');
      setMessageType('success');
      setModalVisible(true);

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/homepage');
      }, 2000);
    } catch (error) {
      console.error('❌ Error saving user:', error.message);
      setMessage('Account created but error saving profile. Please sign in.');
      setMessageType('error');
      setModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (messageType === 'success') {
      router.push('/homepage');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.primary }]}>Create Account</ThemedText>

      <ThemedTextInput placeholder="Full Name" value={name} onChangeText={setName} editable={!isLoading} />
      <ThemedTextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <ThemedTextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <ThemedTextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <ThemedButton
        title={isLoading ? 'Creating Account...' : 'Sign Up'}
        onPress={CreateNewAccount}
        style={isLoading && { backgroundColor: '#aaa' }}
      />

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
              style={{ backgroundColor: theme.primary }}
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
    marginBottom: 32,
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
