import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COGNITO, logoutUrl } from '../config';
import { clearSession } from '../auth';
import { getChapters, ApiError, type StoryChapter } from '../api';

export default function HomeScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<StoryChapter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChapters()
      .then((response) => setChapters(response.chapters))
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          // Session expired: back to the sign-in screen.
          router.replace('/');
          return;
        }
        setError(String(e));
      });
  }, [router]);

  const signOut = async () => {
    await WebBrowser.openAuthSessionAsync(logoutUrl(), COGNITO.nativeCallback);
    await clearSession();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your story</Text>
      {error ? (
        <Text style={styles.error}>Could not load your chapters: {error}</Text>
      ) : chapters === null ? (
        <ActivityIndicator />
      ) : chapters.length === 0 ? (
        <Text style={styles.muted}>No chapters yet. Add learning material to start your story.</Text>
      ) : (
        <Text style={styles.muted}>
          {chapters.length} chapter{chapters.length === 1 ? '' : 's'} so far — the next one continues where the story
          left off.
        </Text>
      )}

      <View style={styles.buttons}>
        <Button title="Add resources" onPress={() => router.push('/capture')} disabled={chapters === null} />
        <Button
          title="Chapters"
          onPress={() => router.push('/chapters')}
          disabled={!chapters || chapters.length === 0}
        />
      </View>

      <View style={styles.footer}>
        <Button title="Sign out" onPress={signOut} />
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  muted: {
    color: '#555',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 32,
    width: 240,
    gap: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  error: {
    color: '#b00020',
  },
});
