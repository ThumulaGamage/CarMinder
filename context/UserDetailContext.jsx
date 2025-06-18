import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

// Create the UserContext
const UserDetailContext = createContext();

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserDetailContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch user details from Firestore
  const fetchUserDetails = async (email) => {
    try {
      const userDocRef = doc(db, 'users', email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDetails(userData);
        return userData;
      } else {
        console.log('No user document found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.message);
      return null;
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
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
          
          // Fetch additional user details from Firestore
          await fetchUserDetails(firebaseUser.email);
        } else {
          // User is signed out
          setUser(null);
          setUserDetails(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserDetails(null);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      setError(error.message);
    }
  };

  // Refresh user details
  const refreshUserDetails = async () => {
    if (user?.email) {
      await fetchUserDetails(user.email);
    }
  };

  // Update user details in context (useful after profile updates)
  const updateUserDetails = (newDetails) => {
    setUserDetails(prevDetails => ({
      ...prevDetails,
      ...newDetails
    }));
  };

  const value = {
    user,                    // Firebase auth user data
    userDetails,            // Firestore user document data
    loading,                // Loading state
    error,                  // Error state
    logout,                 // Sign out function
    refreshUserDetails,     // Refresh user data from Firestore
    updateUserDetails,      // Update user details in context
    isAuthenticated: !!user, // Boolean for authentication status
  };

  return (
    <UserDetailContext.Provider value={value}>
      {children}
    </UserDetailContext.Provider>
  );
};

export { UserDetailContext };