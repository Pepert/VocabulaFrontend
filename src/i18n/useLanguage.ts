import { useCallback, useEffect, useState } from 'react';
import i18n, { setPreSigninChoice, type AppLanguage } from '.';
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

  // Pull the account preference after sign-in; no preference means the
  // device language (or the pre-sign-in choice) stays.
  useEffect(() => {
    let cancelled = false;

    loadSession().then((session) => {
      if (!session || cancelled) {
        return;
      }
      getUser()
        .then((user) => {
          if (cancelled || !user.language) {
            return;
          }
          void i18n.changeLanguage(user.language);
          setLanguageState(user.language as AppLanguage);
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
