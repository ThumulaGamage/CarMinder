import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import useTheme from '../../../../Theme/theme';

export default function VehicleLayout() {
  const theme = useTheme();
  const router = useRouter();

  // Custom header back button component
  const HeaderBackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 15 }}
    >
      <Ionicons name="arrow-back" size={24} color={theme.text} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary || '#999',
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border || '#ccc',
          height: 70, // Reduce tab bar height
        },
        headerStyle: {
          backgroundColor: theme.card,
          height: 100, // Reduce header height
        },
        headerTintColor: theme.text,
        headerTitleAlign: 'center', // Center the header title
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          switch (route.name) {
            case 'vehical':
              iconName = 'car-outline';
              break;
            case 'service':
              iconName = 'construct-outline';
              break;
            case 'licence':
              iconName = 'document-text-outline';
              break;
            case 'Notification':
              iconName = 'notifications-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen 
        name="vehical" 
        options={{ 
          title: 'Vehicle',
          headerTitle: 'Vehicle Details',
          headerLeft: () => <HeaderBackButton />,
        }} 
      />
      <Tabs.Screen 
        name="service" 
        options={{ 
          title: 'Service',
          headerTitle: 'Service Records',
          headerLeft: () => <HeaderBackButton />,
        }} 
      />
      <Tabs.Screen 
        name="licence" 
        options={{ 
          title: 'Documents',
          headerTitle: 'Vehicle Documents',
          headerLeft: () => <HeaderBackButton />,
        }} 
      />
      <Tabs.Screen 
        name="Notification" 
        options={{ 
          title: 'Notifications',
          headerTitle: 'Notifications',
          headerLeft: () => <HeaderBackButton />,
        }} 
      />
    </Tabs>
  );
}