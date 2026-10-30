import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { API_URL } from './src/config';

type HealthState =
  | { status: 'checking' }
  | { status: 'healthy' }
  | { status: 'error'; message: string };

export default function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'checking' });

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        setHealth({ status: 'healthy' });
      })
      .catch((error: unknown) => {
        setHealth({ status: 'error', message: String(error) });
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vocabula</Text>
      <Text testID="health">
        {health.status === 'checking' && 'Checking API…'}
        {health.status === 'healthy' && `API reachable at ${API_URL}`}
        {health.status === 'error' && `API unreachable: ${health.message}`}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
