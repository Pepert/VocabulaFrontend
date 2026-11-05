import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractKnowledge, generateChapter, getChapters, ApiError } from '../api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

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
          <Text style={styles.muted}>
            Photograph a notebook page; the next chapter of your story uses what it finds.
          </Text>
          <View style={styles.buttons}>
            <PrimaryButton title="Take a photo" onPress={() => addMaterial('camera')} />
            <PrimaryButton
              title="Choose from library"
              variant="ghost"
              onPress={() => addMaterial('library')}
            />
          </View>
        </>
      )}

      {phase.step === 'working' && (
        <>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.muted}>{phase.label}</Text>
        </>
      )}

      {phase.step === 'error' && (
        <>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{phase.message}</Text>
          <View style={styles.buttons}>
            <PrimaryButton title="Try again" onPress={() => setPhase({ step: 'pick' })} />
            <PrimaryButton title="Back to home" variant="ghost" onPress={() => router.back()} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
    gap: spacing.s,
  },
  title: {
    ...typography.h2,
  },
  muted: {
    ...typography.bodyMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  buttons: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 320,
    gap: spacing.m,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.red,
  },
  errorText: {
    ...typography.bodyMuted,
    color: colors.red,
    textAlign: 'center',
    maxWidth: 300,
  },
});
