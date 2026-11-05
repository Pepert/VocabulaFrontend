import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractKnowledge, generateChapter, getChapters, ApiError } from '../api';

/** Must match the backend's per-upload limit. */
const MaxImagesPerUpload = 10;

type Phase =
  | { step: 'pick' }
  | { step: 'working'; label: string }
  | { step: 'error'; message: string };

export default function CaptureScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ step: 'pick' });

  const addMaterial = async (source: 'camera' | 'library') => {
    try {
      // The camera requires an explicit permission request (the system
      // prompt appears on first use); the photo library does not.
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPhase({
            step: 'error',
            message:
              'Camera access is needed to photograph your material. ' +
              'You can enable it in Settings → Privacy & Security → Camera.',
          });
          return;
        }
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync({
              ...pickerOptions,
              allowsMultipleSelection: true,
              selectionLimit: MaxImagesPerUpload,
            });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const pickedImages = result.assets.slice(0, MaxImagesPerUpload);

      // iPhones store photos as HEIC; the API accepts jpeg/png/webp.
      // Convert every page to JPEG before uploading.
      setPhase({
        step: 'working',
        label:
          pickedImages.length === 1
            ? 'Preparing photo…'
            : `Preparing ${pickedImages.length} photos…`,
      });
      const prepared = await Promise.all(
        pickedImages.map((asset) =>
          ImageManipulator.manipulateAsync(asset.uri, [], {
            format: ImageManipulator.SaveFormat.JPEG,
            compress: 0.85,
          })
        )
      );

      setPhase({
        step: 'working',
        label:
          pickedImages.length === 1
            ? 'Reading your notebook…'
            : `Reading ${pickedImages.length} notebook pages…`,
      });
      const knowledge = await extractKnowledge(
        prepared.map((p) => p.uri),
        'image/jpeg'
      );

      setPhase({ step: 'working', label: 'Writing your next chapter…' });
      await generateChapter(knowledge);

      // Redirect to the freshly generated chapter; the highest chapter
      // number is the one that was just written.
      setPhase({ step: 'working', label: 'Opening your chapter…' });
      const chapters = await getChapters();
      const latest = Math.max(...chapters.chapters.map((c) => c.chapterNumber));
      router.replace(`/chapter/${latest}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/');
        return;
      }
      const message = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e);
      setPhase({ step: 'error', message });
    }
  };

  return (
    <View style={styles.container}>
      {phase.step === 'pick' && (
        <>
          <Text style={styles.title}>Add learning material</Text>
          <Text style={styles.muted}>Photograph a notebook page; the next chapter of your story uses what it finds.</Text>
          <View style={styles.buttons}>
            <Button title="Take a photo" onPress={() => addMaterial('camera')} />
            <Button title="Choose from library" onPress={() => addMaterial('library')} />
          </View>
        </>
      )}

      {phase.step === 'working' && (
        <>
          <ActivityIndicator />
          <Text style={styles.muted}>{phase.label}</Text>
        </>
      )}

      {phase.step === 'error' && (
        <>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.error}>{phase.message}</Text>
          <View style={styles.buttons}>
            <Button title="Try again" onPress={() => setPhase({ step: 'pick' })} />
            <Button title="Back to home" onPress={() => router.back()} />
          </View>
        </>
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  muted: {
    color: '#555',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 24,
    width: 240,
    gap: 12,
  },
  error: {
    color: '#b00020',
    textAlign: 'center',
  },
});
