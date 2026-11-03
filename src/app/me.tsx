import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, COGNITO, logoutUrl } from '../config';
import { clearSession, loadSession, type Session } from '../auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession().then((s) => {
      if (!s) {
        router.replace('/');
        return;
      }
      setSession(s);
      fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${s.accessToken}` },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const body = (await response.json()) as { userId: string };
          setUserId(body.userId);
        })
        .catch((e: unknown) => setError(String(e)));
    });
  }, [router]);

  const signOut = async () => {
    // End the hosted UI session in the browser first, so the next sign-in
    // shows the provider selection instead of silently re-authenticating.
    await WebBrowser.openAuthSessionAsync(logoutUrl(), COGNITO.nativeCallback);
    await clearSession();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are signed in</Text>
      {userId ? (
        <Text testID="userId">User id: {userId}</Text>
      ) : error ? (
        <Text style={styles.error}>API error: {error}</Text>
      ) : (
        <ActivityIndicator />
      )}
      <View style={styles.button}>
        <Button title="Sign out" onPress={signOut} disabled={!session} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 32,
    width: 220,
  },
  error: {
    color: '#b00020',
  },
});
