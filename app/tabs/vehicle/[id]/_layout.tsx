import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
          //height: 100,
        },
        headerTintColor: theme.text,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
        },
        headerLeft: () => <HeaderBackButton />,
      }}
    >
   
    </Stack>
  );
}