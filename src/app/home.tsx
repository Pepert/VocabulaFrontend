import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { COGNITO, logoutUrl } from '../config';
import { clearSession } from '../auth';
import { getChapters, ApiError, type StoryChapter } from '../api';
import PrimaryButton, { Card } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
    const outcome = await WebBrowser.openAuthSessionAsync(logoutUrl(), COGNITO.nativeCallback);
    // Cancelled the pop-up? Stay signed in instead of dropping the session.
    if (outcome.type === 'cancel' || outcome.type === 'dismiss') {
      return;
    }
    await clearSession();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>

      {error ? (
        <Text style={styles.error}>{t('home.loadError', { error })}</Text>
      ) : chapters === null ? (
        <ActivityIndicator color={colors.blue} />
      ) : chapters.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.emptyTitle')}</Text>
          <Text style={styles.cardText}>{t('home.emptyText')}</Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.chapter', { count: chapters.length })}</Text>
          <Text style={styles.cardText}>
            {chapters.length === 1 ? t('home.oneChapter') : t('home.manyChapters', { count: chapters.length })}
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          title={t('home.addResources')}
          disabled={chapters === null}
          onPress={() => router.push('/capture')}
        />
        <PrimaryButton
          title={t('home.chapters')}
          variant="blue"
          disabled={!chapters || chapters.length === 0}
          onPress={() => router.push('/chapters')}
        />
      </View>

      <View style={[styles.footer, { marginBottom: insets.bottom + spacing.m }]}>
        <PrimaryButton
          title={t('home.settings')}
          variant="ghost"
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        />
        <PrimaryButton title={t('home.signOut')} variant="ghost" onPress={signOut} />
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
    flexDirection: 'row',
    gap: spacing.s,
  },
  settingsButton: {
    minHeight: 48,
  },
  error: {
    ...typography.bodyMuted,
    color: colors.red,
    textAlign: 'center',
  },
});
