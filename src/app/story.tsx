import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getChapters, type StoryChapter } from '../api';

export default function StoryScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<StoryChapter[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openChapter, setOpenChapter] = useState<number | null>(null);

  useEffect(() => {
    getChapters()
      .then((response) => setChapters(response.chapters))
      .catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Could not load your story: {error}</Text>
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
          <Text style={styles.title}>Your story</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>No chapters yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.chapter}>
          <Button
            title={`Chapter ${item.chapterNumber}`}
            onPress={() => setOpenChapter(openChapter === item.chapterNumber ? null : item.chapterNumber)}
          />
          {openChapter === item.chapterNumber && (
            <View style={styles.chapterBody}>
              <Text style={styles.story}>{item.content}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 16,
  },
  chapter: {
    marginBottom: 8,
  },
  chapterBody: {
    marginTop: 8,
  },
  story: {
    lineHeight: 24,
  },
  muted: {
    color: '#555',
  },
  error: {
    color: '#b00020',
  },
});
