import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getChapters, ApiError, type StoryChapter } from '../api';

export default function ChaptersScreen() {
  const router = useRouter();
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
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={chapters}
      keyExtractor={(chapter) => String(chapter.chapterNumber)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Button title="‹ Home" onPress={() => router.back()} />
          <Text style={styles.title}>Your chapters</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>No chapters yet. Add learning material from home to write your first one.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push(`/chapter/${item.chapterNumber}`)}
        >
          <Text style={styles.chapterTitle}>
            Chapter {item.chapterNumber} - {item.storyTitle}
          </Text>
          <Text style={styles.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  muted: {
    color: '#555',
  },
  error: {
    color: '#b00020',
  },
});
