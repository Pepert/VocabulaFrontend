import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChapters, ApiError, type NewWordDefinition, type StoryChapter } from '../../api';
import { splitChapterByNewWords } from '../../lib/chapterSegments';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';

/** Reading page for a single chapter, routed as /chapter/[number]. */
export default function ChapterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { number } = useLocalSearchParams<{ number: string }>();
  const chapterNumber = Number(number);
  // undefined = still loading, null = chapter not found.
  const [chapter, setChapter] = useState<StoryChapter | null | undefined>(undefined);
  const [selectedWord, setSelectedWord] = useState<NewWordDefinition | null>(null);

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

  const segments = splitChapterByNewWords(chapter.content, chapter.newWords);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s }]}>
        <PrimaryButton title="‹ Chapters" variant="ghost" onPress={() => router.back()} />

        <View style={styles.pill}>
          <Text style={styles.pillText}>Chapter {chapter.chapterNumber}</Text>
        </View>

        <Text style={styles.title}>{chapter.title ?? chapter.storyTitle}</Text>
        <Text style={styles.story}>
          {segments.map((segment, index) =>
            segment.kind === 'text' ? (
              <Text key={index}>{segment.text}</Text>
            ) : (
              <Text
                key={index}
                style={styles.newWord}
                onPress={() => setSelectedWord(segment.entry)}
              >
                {segment.text}
              </Text>
            )
          )}
        </Text>
      </ScrollView>

      {/* Tap-a-word definition sheet. */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWord(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedWord(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetWord}>{selectedWord?.word}</Text>
            <Text style={styles.sheetDefinition}>
              {selectedWord?.definition ?? 'No definition available yet — it may appear in a future chapter.'}
            </Text>
            <PrimaryButton title="Close" variant="ghost" onPress={() => setSelectedWord(null)} />
          </View>
        </Pressable>
      </Modal>
    </>
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
  newWord: {
    ...typography.reading,
    color: colors.blue,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.l,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.l,
    width: '100%',
    maxWidth: 340,
    gap: spacing.m,
  },
  sheetWord: {
    ...typography.h2,
  },
  sheetDefinition: {
    ...typography.bodyMuted,
  },
  muted: {
    ...typography.bodyMuted,
  },
});
