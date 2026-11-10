import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { COGNITO, logoutUrl } from '../config';
import { clearSession } from '../auth';
import { getChapters, ApiError, type StoryChapter } from '../api';
import PrimaryButton, { Card } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chapters, setChapters] = useState<StoryChapter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refetch on every focus: coming back from the chapter generated for a
  // new capture must re-enable the Chapters button, which depends on the
  // count just changing on the server.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      getChapters()
        .then((response) => {
          if (!cancelled) {
            setChapters(response.chapters);
          }
        })
        .catch((e: unknown) => {
          if (cancelled) {
            return;
          }
          if (e instanceof ApiError && e.status === 401) {
            // Session expired: back to the sign-in screen.
            router.replace('/');
            return;
          }
          setError(String(e));
        });

      return () => {
        cancelled = true;
      };
    }, [router])
  );

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
        <ActivityIndicator color={colors.blue} />
      ) : chapters.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>A story awaits 📖</Text>
          <Text style={styles.cardText}>
            Photograph a page of your notebook, and the first chapter of your story writes itself
            with the words you are learning.
          </Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{chapters.length > 0 && `Chapter ${chapters.length}`}</Text>
          <Text style={styles.cardText}>
            {chapters.length === 1
              ? 'One chapter written so far. New pages keep the story going.'
              : `${chapters.length} chapters written so far. New pages keep the story going.`}
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          title="Add resources"
          disabled={chapters === null}
          onPress={() => router.push('/capture')}
        />
        <PrimaryButton
          title="Chapters"
          variant="blue"
          disabled={!chapters || chapters.length === 0}
          onPress={() => router.push('/chapters')}
        />
      </View>

      <View style={[styles.footer, { marginBottom: insets.bottom + spacing.m }]}>
        <PrimaryButton title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
    gap: spacing.s,
  },
  title: {
    ...typography.h1,
  },
  card: {
    marginTop: spacing.l,
    width: '100%',
    maxWidth: 360,
  },
  cardTitle: {
    ...typography.h2,
  },
  cardText: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 360,
    gap: spacing.m,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  error: {
    ...typography.bodyMuted,
    color: colors.red,
    textAlign: 'center',
  },
});
