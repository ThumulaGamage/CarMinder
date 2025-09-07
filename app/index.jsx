import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '../constant/Colors';
import { useUser } from '../context/UserDetailContext';

export default function Index() {
  const { loading, isAuthenticated, user, error } = useUser();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('📱 Index - Auth State Update:', {
      loading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasNavigated,
      error
    });

    // Only navigate if we haven't navigated yet and loading is complete
    if (!loading && !hasNavigated) {
      if (isAuthenticated && user) {
        console.log('✅ Index - Auto-login successful, navigating to homepage');
        setHasNavigated(true);
        router.replace('/homepage');
      } else {
        console.log('🔐 Index - No authenticated user, navigating to welcome');
        setHasNavigated(true);
        router.replace('/welcome');
      }
    }
  }, [loading, isAuthenticated, user, router, hasNavigated, error]);

  // Reset navigation flag when auth state changes significantly
  useEffect(() => {
    if (loading) {
      setHasNavigated(false);
    }
  }, [loading]);

  // Show loading screen while Firebase checks authentication status
  if (loading || !hasNavigated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY || '#007AFF'} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading CarMinder...' : 'Navigating...'}
        </Text>
        
        {/* Debug info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Has User: {user ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Has Navigated: {hasNavigated ? 'Yes' : 'No'}</Text>
          {error && <Text style={styles.debugText}>Error: {error}</Text>}
        </View>
      </View>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetails}>{error}</Text>
      </View>
    );
  }

  return null; // This should not render since we redirect above
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE || '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.PRIMARY || '#007AFF',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 30,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    width: '80%',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE || '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});