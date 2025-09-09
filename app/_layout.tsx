import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import { UserProvider } from "../context/UserDetailContext";
// Import notification services
import NotificationService from "../Services/NotificationService";
import VehicleNotificationScheduler from "../Services/VehicleNotificationScheduler";
import LoadingScreen from "../components/LoadingScreen";

export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);


  const [loading, setLoading] = useState(true);




  // Define refs with proper TypeScript types
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Handle notification response function with TypeScript typing
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      try {
        const data = response.notification.request.content.data || {};
        console.log('Notification response data:', data);
        
        if (data.action === 'open_document' && data.vehicleId) {
          if (data.type === 'license') {
            router.push(`/tabs/vehicle/${data.vehicleId}/Vehicle Documents?tab=license`);
          } else if (data.type === 'insurance') {
            router.push(`/tabs/vehicle/${data.vehicleId}/Vehicle Documents?tab=insurance`);
          }
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    };

    // Set up notification listeners
    const setupNotificationListeners = () => {
      try {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
          console.log('Notification received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
        
        console.log('Notification listeners set up successfully');
      } catch (error) {
        console.error('Error setting up notification listeners:', error);
      }
    };

    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notifications for authenticated user...');
        
        // Register for push notifications
        const token = await NotificationService.registerForPushNotifications();
        
        if (token) {
          // Save token to Firebase
          await VehicleNotificationScheduler.savePushToken(token);
          console.log('Push notifications initialized successfully');
        } else {
          console.log('Using local notifications only');
        }

        // Add a small delay to ensure Firebase data is ready
        setTimeout(async () => {
          try {
            // Schedule all vehicle notifications
            await VehicleNotificationScheduler.scheduleAllVehicleNotifications();

            // Check for immediate notifications
            await VehicleNotificationScheduler.checkImmediateNotifications();
          } catch (error) {
            console.error('Error scheduling notifications:', error);
          }
        }, 2000);

      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    // Set up notification listeners first
    setupNotificationListeners();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      console.log('Auth state changed:', currentUser ? 'logged in' : 'logged out');
      setUser(currentUser);
      
      if (currentUser && !isInitialized) {
        // Only initialize notifications when user is authenticated
        initializeNotifications();
        setIsInitialized(true);
      } else if (!currentUser) {
        // Clear notifications when user logs out
        NotificationService.cancelAllNotifications();
        setIsInitialized(false);
      }
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up RootLayout listeners');
      
      if (unsubscribe) {
        unsubscribe();
      }
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router, isInitialized]);

  // Reset initialization when user changes
  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
    }
  }, [user]);

  return (
    <UserProvider>
      <StatusBar style="auto" />
      {loading ? (
        <LoadingScreen onFinish={() => setLoading(false)} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="homepage" />
          <Stack.Screen name="auth/signIn" />
          <Stack.Screen name="auth/signUp" />
          <Stack.Screen name="tabs/AddVehicle" />
          <Stack.Screen name="tabs/HomeTab" />
          <Stack.Screen name="tabs/NotificationTab" />
          <Stack.Screen name="tabs/SettingTab" />
          <Stack.Screen name="tabs/UserTab" />
          <Stack.Screen name="tabs/vehicle/[id]" />
        </Stack>
      )}
    </UserProvider>
  );
}