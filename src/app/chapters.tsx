import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getChapters, ApiError, type StoryChapter } from '../api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export default function ChaptersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [chapters, setChapters] = useState<StoryChapter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChapters()
      .then((response) => setChapters(response.chapters))
      .catch(async (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          // Session expired: back to the sign-in screen.
          router.replace('/');
          return;
        }
        setError(String(e));
      });
  }, [router]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t('home.loadError', { error })}</Text>
      </View>
    );
  }

  if (chapters === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s }]}
      data={chapters}
      keyExtractor={(chapter) => String(chapter.chapterNumber)}
      ListHeaderComponent={
        <View style={styles.header}>
          <PrimaryButton title={`‹ ${t('common.home')}`} variant="ghost" onPress={() => router.back()} />
          <Text style={styles.title}>{t('chapters.title')}</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>{t('chapters.empty')}</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(`/chapter/${item.chapterNumber}`)}
        >
          <View style={styles.rowText}>
            <Text style={styles.chapterTitle}>
              {t('chapter.pill', { number: item.chapterNumber })} · {item.title ?? item.storyTitle}
            </Text>
            <Text style={styles.muted}>
              {new Date(item.createdAt).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB')}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  list: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xxl + spacing.s,
  },
  header: {
    marginBottom: spacing.m,
    gap: spacing.m,
  },
  title: {
    ...typography.h1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  rowPressed: {
    transform: [{ translateY: 2 }],
  },
  rowText: {
    flex: 1,
  },
  chapterTitle: {
    ...typography.h2,
    fontSize: 17,
  },
  muted: {
    ...typography.bodyMuted,
  },
  chevron: {
    ...typography.h2,
    color: colors.blue,
  },
  error: {
    ...typography.bodyMuted,
    color: colors.red,
    textAlign: 'center',
  },
});
