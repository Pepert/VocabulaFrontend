import * as SecureStore from 'expo-secure-store';
import type { AppLanguage } from '.';
import { SupportedLanguages } from '.';

/**
 * Locally caches the account's UI language so a cold start renders in the
 * right language immediately, before the account fetch resolves. The
 * account remains the source of truth; this is only a rendering hint, so
 * it lives in the keychain but is never authoritative.
 */
const StoredLanguageKey = 'vocabula.ui-language';

export async function storeLanguage(language: AppLanguage): Promise<void> {
  await SecureStore.setItemAsync(StoredLanguageKey, language);
}

/** The last language used on this device, or null on first launch. */
export async function loadStoredLanguage(): Promise<AppLanguage | null> {
  const stored = await SecureStore.getItemAsync(StoredLanguageKey);
  if (stored && (SupportedLanguages as readonly string[]).includes(stored)) {
    return stored as AppLanguage;
  }
  return null;
}
