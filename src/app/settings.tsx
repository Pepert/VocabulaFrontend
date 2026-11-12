import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PrimaryButton from '../components/PrimaryButton';
import { type AppLanguage } from '../i18n';
import { useLanguage } from '../i18n/useLanguage';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

/**
 * Account settings. "General" unfolds like in most modern apps, ready to
 * host future sections (profile, account, plan, contact, ...).
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [openSection, setOpenSection] = useState<'general' | null>('general');

  const selectLanguage = (choice: AppLanguage) => {
    setLanguage(choice);
  };

  const rows: { language: AppLanguage; label: string }[] = [
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
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <Text style={styles.sectionHint}>{t('settings.languageHint')}</Text>
          {rows.map((row) => {
            const selected = language === row.language;
            return (
              <Pressable
                key={row.language}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
                onPress={() => selectLanguage(row.language)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {row.label}
                </Text>
                <View style={[styles.radio, selected && styles.radioSelected]} />
              </Pressable>
            );
          })}
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
