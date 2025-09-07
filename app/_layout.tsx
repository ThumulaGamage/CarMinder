import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from "../context/UserDetailContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <StatusBar style="auto" />
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
    </UserProvider>
  );
}