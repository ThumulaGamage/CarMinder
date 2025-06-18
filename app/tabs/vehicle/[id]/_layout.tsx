// app/tabs/vehicle/[id]/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useLocalSearchParams } from 'expo-router';

export default function VehicleLayout() {
  const { id } = useLocalSearchParams(); // get vehicle ID

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: `Vehicle ${id}`,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          switch (route.name) {
            case 'home':
              iconName = 'home-outline';
              break;
            case 'service':
              iconName = 'car-outline';
              break;
            case 'licence':
              iconName = 'document-text-outline';
              break;
            case 'setting':
              iconName = 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="service" options={{ title: 'Service Record' }} />
      <Tabs.Screen name="licence" options={{ title: 'Licence' }} />
      <Tabs.Screen name="setting" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
