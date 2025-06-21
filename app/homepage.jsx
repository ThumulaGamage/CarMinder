import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AuthGuard from '../components/AuthGuard';
import useTheme from '../Theme/theme'; // ✅ Import your theme
import AccountTab from './tabs/AccountTab';
import VehicalTab from './tabs/VehicalTab';

const Tab = createBottomTabNavigator();

function HomePageTabs() {
  const theme = useTheme(); // ✅ Use your theme

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Vehical') {
            iconName = 'car-sport-outline';
          } else if (route.name === 'Account') {
            iconName = 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,       // ✅ Use themed primary color
        tabBarInactiveTintColor: theme.textMuted || 'gray', // Optional fallback
        tabBarStyle: {
          backgroundColor: theme.background,        // ✅ Themed tab bar background
          borderTopColor: theme.border || '#ccc',   // Optional border color
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Vehical" component={VehicalTab} />
      <Tab.Screen name="Account" component={AccountTab} />
    </Tab.Navigator>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomePageTabs />
    </AuthGuard>
  );
}
