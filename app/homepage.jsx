
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AuthGuard from '../components/AuthGuard';
import AccountTab from './tabs/AccountTab';
import VehicalTab from './tabs/VehicalTab';

const Tab = createBottomTabNavigator();

function HomePageTabs() {
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
        tabBarActiveTintColor: '#007AFF', // Blue color for active tab
        tabBarInactiveTintColor: 'gray',
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
