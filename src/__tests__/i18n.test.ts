import { getLocales } from 'expo-localization';
import en from '../i18n/en';
import fr from '../i18n/fr';
import i18next, {
  deviceLanguage,
  defaultLanguage,
  setPreSigninChoice,
  SupportedLanguages,
} from '../i18n';

jest.mock('expo-localization', () => ({
  __esModule: true,
  getLocales: jest.fn(() => []),
}));

describe('deviceLanguage', () => {
  it('maps a French device to fr', () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'fr-FR' }]);
    expect(deviceLanguage()).toBe('fr');
  });

  it('falls back to en for any other device language', () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'sv' }]);
    expect(deviceLanguage()).toBe('en');
  });

  it('falls back to en when the device locale is unknown', () => {
    (getLocales as jest.Mock).mockReturnValue([]);
    expect(deviceLanguage()).toBe('en');
  });
});

describe('defaultLanguage', () => {
  it('uses the device language when the user picked nothing before sign-in', () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en' }]);
    expect(defaultLanguage()).toBe('en');
  });

  it('the pre-sign-in choice wins over the device language', () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en' }]);
    setPreSigninChoice('fr');
    expect(defaultLanguage()).toBe('fr');
    // Leave the module state clean for the rest of the suite.
    setPreSigninChoice('en');
  });
});

describe('dictionaries', () => {
  it('only ships en and fr', () => {
    expect([...SupportedLanguages]).toEqual(['en', 'fr']);
  });

  it('fr mirrors every en key (and vice versa)', () => {
    const keysOf = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
        : [prefix.slice(0, -1)];

    expect(keysOf(fr)).toEqual(keysOf(en));
  });

  it('translations are actually translated, not copied from en', () => {
    expect(fr.home.title).not.toBe(en.home.title);
    expect(fr.settings.languageFrench).toBe('Français');
  });
});

describe('i18next', () => {
  it('interpolates variables in the active language', () => {
    expect(i18next.t('chapter.pill', { lng: 'fr', number: 3 })).toBe('Chapitre 3');
    expect(i18next.t('chapter.pill', { lng: 'en', number: 3 })).toBe('Chapter 3');
  });

  it('falls back to en for a key missing a translation', () => {
    (fr.chapter as unknown as { close: string }).close = '';
    expect(i18next.t('chapter.close', { lng: 'fr' })).toBe('Close');
  });
});
