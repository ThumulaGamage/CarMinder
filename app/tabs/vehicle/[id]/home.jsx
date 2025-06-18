import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function VehicleHome() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Vehicle Home Screen - ID: {id}</Text>
    </View>
  );
}
