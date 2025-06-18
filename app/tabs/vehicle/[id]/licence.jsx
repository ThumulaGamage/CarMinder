import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function LicenceScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Licence Info for Vehicle {id}</Text>
    </View>
  );
}
