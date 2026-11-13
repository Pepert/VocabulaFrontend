import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// Initializes i18next (side effect) before any screen renders.
import i18n, { type AppLanguage } from '../i18n';
import { loadStoredLanguage, storeLanguage } from '../i18n/storage';
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
  // The first render must already be in the right language: the stored
  // hint is applied before any screen shows, so there is no flash of the
  // device-default language on cold start.
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    loadStoredLanguage()
      .then((stored) => {
        if (stored) {
          return i18n.changeLanguage(stored);
        }
        return undefined;
      })
      .catch(() => undefined)
      .finally(() => setLanguageReady(true));
  }, []);

  // The account's UI language applies here, once per app launch: the
  // sign-in screen redirects too fast for its own language effect when a
  // session exists, and home does not carry one. Whatever wins (the
  // stored hint or the account) is cached for the next launch.
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
              void storeLanguage(user.language as AppLanguage);
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

  if (!loaded || !languageReady) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
