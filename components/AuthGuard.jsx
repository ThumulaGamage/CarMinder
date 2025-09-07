import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Colors from '../constant/Colors';
import { useUser } from '../context/UserDetailContext';

export default function AuthGuard({ children, redirectTo = '/welcome' }) {
  const { user, loading, isAuthenticated } = useUser();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only redirect after we've finished loading AND we've done at least one auth check
    if (!loading && hasCheckedAuth && !isAuthenticated) {
      console.log('🔒 AuthGuard: User not authenticated, redirecting to:', redirectTo);
      router.replace(redirectTo);
    } else if (!loading) {
      setHasCheckedAuth(true);
    }
  }, [loading, isAuthenticated, router, redirectTo, hasCheckedAuth]);

  // Show loading screen while checking authentication
  if (loading || !hasCheckedAuth) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={Colors.GREEN_DARK} />
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          color: Colors.GREEN_DARK
        }}>
          Checking access...
        </Text>
      </View>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{
          fontSize: 16,
          color: Colors.GREEN_DARK
        }}>
          Redirecting to sign in...
        </Text>
      </View>
    );
  }

  // Render children if authenticated
  return children;
}

// Usage examples:

// For main app pages (use the main auth flow instead):
// ❌ Don't use AuthGuard for homepage - let index.tsx handle it

// For specific protected pages that can be accessed directly:
// ✅ Use AuthGuard for individual protected screens
// <AuthGuard redirectTo="/auth/signIn">
//   <ProtectedFeaturePage />
// </AuthGuard>

// For admin-only pages:
// <AuthGuard redirectTo="/not-authorized">
//   <AdminOnlyPage />
// </AuthGuard>