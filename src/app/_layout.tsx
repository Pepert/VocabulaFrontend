import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// Initializes i18next (side effect) before any screen renders.
import i18n from '../i18n';
import { loadSession } from '../auth';
import { getUser } from '../api';
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

// The keys are the registered family names; the imported constants are
// the font files the loader reads.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // The account's UI language applies here, once per app launch: the
  // sign-in screen redirects too fast for its own language effect when a
  // session exists, and home does not carry one.
  useEffect(() => {
    loadSession()
      .then((session) => {
        if (!session) {
          return;
        }
        return getUser()
          .then((user) => {
            if (user.language) {
              void i18n.changeLanguage(user.language);
            }
          })
          .catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (error) {
      console.warn('Font loading failed:', error);
    }
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
