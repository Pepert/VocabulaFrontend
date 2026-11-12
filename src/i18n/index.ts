import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en';
import fr from './fr';

/** Languages the app ships with; en is the fallback of last resort. */
export const SupportedLanguages = ['en', 'fr'] as const;
export type AppLanguage = (typeof SupportedLanguages)[number];

/** The device language mapped to a supported one ('en' when unknown). */
export function deviceLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode?.toLowerCase().split('-')[0];
  return locale === 'fr' ? 'fr' : 'en';
}

/**
 * The language the user picked before signing in (if any). The account has
 * no preference of its own yet, so this wallpapers the device default.
 */
let preSigninChoice: AppLanguage | null = null;
export function setPreSigninChoice(language: AppLanguage): void {
  preSigninChoice = language;
}

/** Pick the active language when the account carries no preference. */
export function defaultLanguage(): AppLanguage {
  return preSigninChoice ?? deviceLanguage();
}

// The chained `i18next.use()` call is the i18next idiom; eslint flags a
// false positive of an unrelated named export.
// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next).init({
  lng: defaultLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false }, // React Native: no HTML escaping
});

export default i18next;
