import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import useTheme from '../../../../Theme/theme';
import ThemedText from '../../../../components/ThemedText';
import ThemedView from '../../../../components/ThemedView';

export default function NotificationScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.text, { color: theme.text }]}>
        Notifications for Vehicle {id}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
});
