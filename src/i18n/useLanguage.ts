import { useCallback, useEffect, useState } from 'react';
import i18n, { getPreSigninChoice, setPreSigninChoice, type AppLanguage } from '.';
import { getUser, updateUserLanguage } from '../api';
import { loadSession } from '../auth';

/**
 * The UI language and the plumbing that keeps it in sync with the user's
 * account: once signed in, the saved preference (if any) wins; while signed
 * out, the choice made on the sign-in page wall-papers the device default.
 */
export function useLanguage(): {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
} {
  const [language, setLanguageState] = useState<AppLanguage>(
    (i18n.language as AppLanguage) ?? 'en'
  );

  // Pull the account preference after sign-in. When the account has none
  // but the user picked a language on the sign-in page, that choice
  // becomes the account's default — the backend needs it too, since it
  // writes vocabulary translations and definitions in this language.
  useEffect(() => {
    let cancelled = false;

    loadSession().then((session) => {
      if (!session || cancelled) {
        return;
      }
      getUser()
        .then((user) => {
          if (cancelled) {
            return;
          }
          if (user.language) {
            // The account already carries a preference: it always wins.
            void i18n.changeLanguage(user.language);
            setLanguageState(user.language as AppLanguage);
            return;
          }

          const choice = getPreSigninChoice();
          if (choice) {
            // Best effort: the app already displays the choice; persisting
            // it also teaches the backend which language to define words in.
            void updateUserLanguage(choice).catch(() => undefined);
          }
        })
        .catch(() => {
          // Offline or not signed in: the current language simply stays.
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    void i18n.changeLanguage(next);
    setLanguageState(next);

    loadSession().then((session) => {
      if (session) {
        // Account-level preference: follows the user to other devices.
        void updateUserLanguage(next).catch(() => undefined);
      } else {
        // Signed out: remember the choice for after the sign-in.
        setPreSigninChoice(next);
      }
    });
  }, []);

  return { language, setLanguage };
}
