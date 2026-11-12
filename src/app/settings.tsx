import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PrimaryButton from '../components/PrimaryButton';
import { updateLearningLanguage, getUser, LearningLanguageCodes, type LearningLanguageCode } from '../api';
import { type AppLanguage } from '../i18n';
import { useLanguage } from '../i18n/useLanguage';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

/**
 * Account settings. "General" unfolds like in most modern apps, ready to
 * host future sections (profile, account, plan, contact, ...). It holds
 * the app's UI language and the language the user is learning.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [learningLanguage, setLearningLanguage] = useState<LearningLanguageCode | null | undefined>(undefined);
  const [openSection, setOpenSection] = useState<'general' | null>('general');

  // Refresh on every focus: the learning language can change on another
  // device (or through the home screen's prompt) and must stay current.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getUser()
        .then((user) => {
          if (!cancelled) {
            setLearningLanguage(user.learningLanguage ?? null);
          }
        })
        .catch(() => {
          // Offline: keep showing the last known choice.
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const chooseLearningLanguage = (choice: LearningLanguageCode) => {
    setLearningLanguage(choice);
    // Best effort: the offline case keeps the local choice for this view.
    updateLearningLanguage(choice).catch(() => undefined);
  };

  const learningLabelKeys: Record<LearningLanguageCode, string> = {
    en: 'settings.learningEnglish',
    fr: 'settings.learningFrench',
    es: 'settings.learningSpanish',
    sv: 'settings.learningSwedish',
  };

  const learningRows: { code: LearningLanguageCode; label: string }[] = LearningLanguageCodes.map((code) => ({
    code,
    label: t(learningLabelKeys[code]),
  }));

  const uiRows: { language: AppLanguage; label: string }[] = [
    { language: 'en', label: t('settings.languageEnglish') },
    { language: 'fr', label: t('settings.languageFrench') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.s }]}>
      <PrimaryButton title={`‹ ${t('common.home')}`} variant="ghost" onPress={() => router.back()} />
      <Text style={styles.title}>{t('settings.title')}</Text>

      <Pressable
        style={styles.sectionHeader}
        onPress={() => setOpenSection(openSection === 'general' ? null : 'general')}
      >
        <Text style={styles.sectionTitle}>{t('settings.general')}</Text>
        <Text style={styles.chevron}>{openSection === 'general' ? '⌃' : '⌄'}</Text>
      </Pressable>

      {openSection === 'general' && (
        <View style={styles.section}>
          {learningLanguage === undefined ? (
            <ActivityIndicator color={colors.green} />
          ) : (
            <>
              <Text style={styles.sectionLabel}>{t('settings.learningLanguage')}</Text>
              <Text style={styles.sectionHint}>{t('settings.learningHint')}</Text>
              {learningRows.map((row) => (
                <OptionRow
                  key={row.code}
                  label={row.label}
                  selected={learningLanguage === row.code}
                  onPress={() => chooseLearningLanguage(row.code)}
                />
              ))}

              <Text style={[styles.sectionLabel, styles.groupGap]}>{t('settings.language')}</Text>
              <Text style={styles.sectionHint}>{t('settings.languageHint')}</Text>
              {uiRows.map((row) => (
                <OptionRow
                  key={row.language}
                  label={row.label}
                  selected={language === row.language}
                  onPress={() => setLanguage(row.language)}
                />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

/** One choice row with the shared radio style. */
function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    padding: spacing.l,
  },
  title: {
    ...typography.h1,
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.l,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
  },
  sectionTitle: {
    ...typography.h2,
  },
  chevron: {
    ...typography.h2,
    color: colors.blue,
  },
  section: {
    marginTop: spacing.m,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.l,
    padding: spacing.m,
    gap: spacing.s,
  },
  sectionLabel: {
    ...typography.h2,
    fontSize: 17,
  },
  sectionHint: {
    ...typography.bodyMuted,
  },
  groupGap: {
    marginTop: spacing.m,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s + 2,
    paddingHorizontal: spacing.m,
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionRowSelected: {
    borderColor: colors.green,
    backgroundColor: colors.surfaceTint,
  },
  optionText: {
    ...typography.bodyMuted,
    ...fontFamily(700),
  },
  optionTextSelected: {
    color: colors.text,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
});
