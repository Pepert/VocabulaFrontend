import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getChapters, ApiError, type StoryChapter } from '../../api';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';

/** Reading page for a single chapter, routed as /chapter/[number]. */
export default function ChapterScreen() {
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number: string }>();
  const chapterNumber = Number(number);
  // undefined = still loading, null = chapter not found.
  const [chapter, setChapter] = useState<StoryChapter | null | undefined>(undefined);

  useEffect(() => {
    getChapters()
      .then((response) => setChapter(
        response.chapters.find((c) => c.chapterNumber === chapterNumber) ?? null
      ))
      .catch(async (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          router.replace('/');
          return;
        }
        setChapter(null);
      });
  }, [chapterNumber, router]);

  if (chapter === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (chapter === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Chapter {number} not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <PrimaryButton title="‹ Chapters" variant="ghost" onPress={() => router.back()} />

      <View style={styles.pill}>
        <Text style={styles.pillText}>Chapter {chapter.chapterNumber}</Text>
      </View>

      <Text style={styles.title}>{chapter.storyTitle}</Text>
      <Text style={styles.story}>{chapter.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xxl,
    gap: spacing.s,
  },
  pill: {
    marginTop: spacing.m,
    alignSelf: 'flex-start',
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.m,
  },
  pillText: {
    ...fontFamily(800),
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.text,
  },
  title: {
    ...typography.h1,
  },
  story: {
    ...typography.reading,
    marginTop: spacing.m,
  },
  muted: {
    ...typography.bodyMuted,
  },
});
