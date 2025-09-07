import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';

const UserDetailContext = createContext();

export const useUser = () => {
  const context = useContext(UserDetailContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDetails = async (uid) => {
    try {
      console.log('📥 Fetching user details for UID:', uid);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDetails(userData);
        console.log('✅ User details loaded:', userData.name);
        return userData;
      } else {
        console.log('❌ No user document found in Firestore');
        setUserDetails(null);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user details:', error);
      setError(`Failed to load user profile: ${error.message}`);
      setUserDetails(null);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log('🔐 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
        
        if (firebaseUser) {
          // User is signed in
          const basicUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
          };

          setUser(basicUserData);
          setError(null); // Clear any previous errors
          
          // Fetch additional user details from Firestore
          await fetchUserDetails(firebaseUser.uid);
        } else {
          // User is signed out
          setUser(null);
          setUserDetails(null);
          setError(null);
        }
        
        setLoading(false);
      },
      (authError) => {
        console.error('❌ Auth state change error:', authError);
        setError(`Authentication error: ${authError.message}`);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setLoading(true); // Show loading during logout
      console.log('🚪 Signing out user...');
      
      await signOut(auth);
      // onAuthStateChanged will automatically clear user state
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      setError(`Sign out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserDetails = async () => {
    if (user?.uid) {
      console.log('🔄 Refreshing user details...');
      await fetchUserDetails(user.uid);
    } else {
      console.log('⚠️ Cannot refresh: No authenticated user');
    }
  };

  const updateUserDetails = (newDetails) => {
    console.log('📝 Updating user details locally:', Object.keys(newDetails));
    setUserDetails(prevDetails => ({
      ...prevDetails,
      ...newDetails
    }));
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // User data
    user,
    userDetails,
    
    // States
    loading,
    error,
    isAuthenticated: !!user,
    
    // Actions
    logout,
    refreshUserDetails,
    updateUserDetails,
    clearError,
    
    // Computed properties
    displayName: userDetails?.name || user?.displayName || user?.email?.split('@')[0] || 'User',
    isEmailVerified: user?.emailVerified || false,
  };

  return (
    <UserDetailContext.Provider value={value}>
      {children}
    </UserDetailContext.Provider>
  );
};

export { UserDetailContext };
