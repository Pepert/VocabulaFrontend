import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractKnowledge, generateChapter, ApiError } from '../api';
import {
  addPhotos,
  canAddMore,
  removePhoto,
  type SelectedPhoto,
} from '../lib/photoSelection';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

/** Must match the backend's per-upload limit. */
const MaxImagesPerUpload = 10;

type Phase =
  | { step: 'pick' }
  | { step: 'review' }
  | { step: 'working'; label: string }
  | { step: 'error'; message: string };

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>({ step: 'pick' });
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);

  const pickMore = async (source: 'camera' | 'library') => {
    try {
      // The camera requires an explicit permission request (the system
      // prompt appears on first use); the photo library does not.
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPhase({
            step: 'error',
            message: t('capture.cameraPermission'),
          });
          return;
        }
      }

      // The camera picks one photo per shot; multi-shot means returning to
      // the review screen between shots. The library still picks many.
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

      const pickedUris = result.assets
        .slice(0, MaxImagesPerUpload)
        .map((asset) => asset.uri);
      const { photos: merged, dropped } = addPhotos(photos, pickedUris, MaxImagesPerUpload);
      setPhotos(merged);
      setIgnoredCount(dropped);
      setPhase({ step: 'review' });
    } catch (e) {
      const message = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e);
      setPhase({ step: 'error', message });
    }
  };

  // The confirmed pipeline, unchanged from the direct flow: convert every
  // page to JPEG, extract the knowledge, write the chapter, open it.
  const confirm = async () => {
    try {
      setPhase({
        step: 'working',
        label:
          photos.length === 1
            ? t('capture.preparingOne')
            : t('capture.preparingMany', { count: photos.length }),
      });
      const prepared = await Promise.all(
        photos.map((photo) =>
          ImageManipulator.manipulateAsync(photo.uri, [], {
            format: ImageManipulator.SaveFormat.JPEG,
            compress: 0.85,
          })
        )
      );

      setPhase({ step: 'working', label: t('capture.readingOne') });
      const knowledge = await extractKnowledge(
        prepared.map((p) => p.uri),
        'image/jpeg'
      );

      setPhase({ step: 'working', label: t('capture.writing') });
      const generate = await generateChapter(knowledge);

      // The response carries the new chapter's number, so no re-fetch of
      // the chapter list is needed to redirect to it.
      setPhase({ step: 'working', label: t('capture.opening') });
      router.replace(`/chapter/${generate.chapterNumber}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/');
        return;
      }
      const message = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e);
      setPhase({ step: 'error', message });
    }
  };

  const retry = () => {
    // After a failed upload the pictures are still selected: review them
    // again instead of losing the whole session's picks.
    setPhase(photos.length > 0 ? { step: 'review' } : { step: 'pick' });
  };

  return (
    <View style={styles.container}>
      {phase.step !== 'working' && (
        <PrimaryButton
          title={`‹ ${t('common.home')}`}
          variant="ghost"
          onPress={() => router.back()}
          style={[styles.back, { marginTop: insets.top + spacing.s }]}
        />
      )}

      {phase.step === 'pick' && (
        <View style={styles.centered}>
          <Text style={styles.title}>{t('capture.title')}</Text>
          <Text style={styles.muted}>{t('capture.description')}</Text>
          <View style={styles.buttons}>
            <PrimaryButton title={t('capture.takePhoto')} onPress={() => pickMore('camera')} />
            <PrimaryButton
              title={t('capture.chooseFromLibrary')}
              variant="ghost"
              onPress={() => pickMore('library')}
            />
          </View>
        </View>
      )}

      {phase.step === 'review' && (
        <View style={styles.centered}>
          <Text style={styles.title}>{t('capture.reviewTitle')}</Text>
          <Text style={styles.muted}>{t('capture.reviewHint')}</Text>
          <Text style={styles.counter}>
            {t('capture.photoCount', { count: photos.length, max: MaxImagesPerUpload })}
          </Text>
          {ignoredCount > 0 && (
            <Text style={styles.notice}>
              {t('capture.photosIgnored', { count: ignoredCount })}
            </Text>
          )}

          <View style={styles.grid}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.tile}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                <Pressable
                  accessibilityLabel={t('capture.remove')}
                  style={styles.remove}
                  onPress={() => setPhotos((current) => removePhoto(current, photo.id))}
                >
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            <PrimaryButton title={t('capture.useThese')} onPress={confirm} />
            {canAddMore(photos, MaxImagesPerUpload) && (
              <>
                <PrimaryButton
                  title={t('capture.takeAnotherPhoto')}
                  variant="ghost"
                  onPress={() => pickMore('camera')}
                />
                <PrimaryButton
                  title={t('capture.addFromLibrary')}
                  variant="ghost"
                  onPress={() => pickMore('library')}
                />
              </>
            )}
          </View>
        </View>
      )}

      {phase.step === 'working' && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.muted}>{phase.label}</Text>
        </View>
      )}

      {phase.step === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>{t('capture.errorTitle')}</Text>
          <Text style={styles.errorText}>{phase.message}</Text>
          <View style={styles.buttons}>
            <PrimaryButton title={t('capture.tryAgain')} onPress={retry} />
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    padding: spacing.l,
  },
  back: {
    alignSelf: 'stretch',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  counter: {
    ...typography.bodyMuted,
    ...fontFamily(700),
  },
  notice: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    gap: spacing.s,
    marginTop: spacing.s,
  },
  tile: {
    width: 88,
    height: 88,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: colors.border,
  },
  remove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.white,
    fontSize: 14,
    ...fontFamily(800),
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
