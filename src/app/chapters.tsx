import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChapters, ApiError, type StoryChapter } from '../api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export default function ChaptersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <Text style={styles.error}>Could not load your chapters: {error}</Text>
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
          <PrimaryButton title="‹ Home" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.title}>Your chapters</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>
          No chapters yet. Add learning material from home to write your first one.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(`/chapter/${item.chapterNumber}`)}
        >
          <View style={styles.rowText}>
            <Text style={styles.chapterTitle}>
              Chapter {item.chapterNumber} · {item.title ?? item.storyTitle}
            </Text>
            <Text style={styles.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
