import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ServiceRecord() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Service Record for Vehicle {id}</Text>
    </View>
  );
}
