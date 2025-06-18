import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function SettingsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings for Vehicle {id}</Text>
    </View>
  );
}
