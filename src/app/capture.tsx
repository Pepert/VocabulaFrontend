import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractKnowledge, generateChapter, type GeneratedStory, ApiError } from '../api';

type Phase =
  | { step: 'pick' }
  | { step: 'working'; label: string }
  | { step: 'done'; story: GeneratedStory }
  | { step: 'error'; message: string };

type CameraPermission = {
  status: ImagePicker.PermissionStatus;
  canAskAgain: boolean;
} | null;

export default function CaptureScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ step: 'pick' });
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>(null);

  useEffect(() => {
    ImagePicker.getCameraPermissionsAsync().then((p) =>
      setCameraPermission({ status: p.status, canAskAgain: p.canAskAgain })
    );
  }, []);

  const requestCameraPermission = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission({ status: p.status, canAskAgain: p.canAskAgain });
  };

  const addMaterial = async (source: 'camera' | 'library') => {
    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      // iPhones store photos as HEIC; the API accepts jpeg/png/webp.
      // Convert to JPEG before uploading.
      setPhase({ step: 'working', label: 'Preparing photo…' });
      const prepared = await ImageManipulator.manipulateAsync(result.assets[0].uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.85,
      });

      setPhase({ step: 'working', label: 'Reading your notebook…' });
      const knowledge = await extractKnowledge(prepared.uri, 'image/jpeg');

      setPhase({ step: 'working', label: 'Writing your next chapter…' });
      const story = await generateChapter(knowledge);

      setPhase({ step: 'done', story });
    } catch (e) {
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
          {/* Temporary diagnostics: what does iOS actually report for the camera permission? */}
          <View style={styles.diagnostics}>
            <Text style={styles.muted}>
              Camera permission: {cameraPermission ? cameraPermission.status : 'loading…'} (can ask again:{' '}
              {cameraPermission ? String(cameraPermission.canAskAgain) : '…'})
            </Text>
            <Button title="Request camera permission" onPress={requestCameraPermission} />
          </View>
        </>
      )}

      {phase.step === 'working' && (
        <>
          <ActivityIndicator />
          <Text style={styles.muted}>{phase.label}</Text>
        </>
      )}

      {phase.step === 'done' && (
        <>
          <Text style={styles.title}>{phase.story.title}</Text>
          <Text style={styles.story}>{phase.story.story}</Text>
          <View style={styles.buttons}>
            <Button title="Back to my story" onPress={() => router.replace('/story')} />
            <Button title="Add more material" onPress={() => setPhase({ step: 'pick' })} />
          </View>
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
  story: {
    marginTop: 16,
    lineHeight: 24,
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
  diagnostics: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
});
