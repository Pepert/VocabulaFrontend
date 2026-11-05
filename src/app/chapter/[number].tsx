import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getChapters, ApiError, type StoryChapter } from '../../api';

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
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (chapter === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Chapter {number} not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button title="‹ Chapters" onPress={() => router.back()} />
      </View>
      <Text style={styles.chapterLabel}>Chapter {chapter.chapterNumber}</Text>
      <Text style={styles.title}>{chapter.storyTitle}</Text>
      <Text style={styles.story}>{chapter.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 8,
  },
  header: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  chapterLabel: {
    fontSize: 14,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  story: {
    fontSize: 17,
    lineHeight: 28,
  },
  muted: {
    color: '#555',
  },
});
