/**
 * Vocabula design tokens - the single source of truth for the visual
 * language. Documented for humans in docs/design.md; screens must use
 * these tokens instead of hard-coded values.
 */
import { TextStyle, ViewStyle } from 'react-native';

/**
 * Registered font family names. The font FILES are loaded in the root
 * layout from @expo-google-fonts/nunito; these strings are the family
 * names that loading registers for use in styles.
 */
export const FONTS: Record<FontWeight, string> = {
  400: 'Nunito_400Regular',
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
  900: 'Nunito_900Black',
};

export type FontWeight = 400 | 700 | 800 | 900;

export const fontFamily = (weight: FontWeight): { fontFamily: string } => ({
  fontFamily: FONTS[weight],
});

export const colors = {
  /** Primary action green - the "go, learning" color. */
  green: '#58CC02',
  greenEdge: '#43A302',
  /** Blue - links, accents, secondary emphasis. */
  blue: '#1CB0F6',
  blueEdge: '#1899D6',
  /** Yellow - celebration accents (new chapter!). */
  yellow: '#FFC800',
  /** Danger - errors and destructive states. */
  red: '#FF4B4B',
  redEdge: '#E33D3D',
  /** Neutrals. */
  text: '#3C3C3C',
  textMuted: '#8F8F8F',
  border: '#E5E5E5',
  surfaceAlt: '#F7F7F7',
  /** Locked/disabled buttons. */
  lockedBg: '#E5E5E5',
  lockedEdge: '#D6D6D6',
  lockedText: '#AFAFAF',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  s: 8,
  m: 12,
  l: 16,
  pill: 999,
} as const;

/** Body text for regular reading. */
export const typography = {
  h1: { ...fontFamily(900), fontSize: 32, color: colors.text } as TextStyle,
  h2: { ...fontFamily(900), fontSize: 22, color: colors.text } as TextStyle,
  body: { ...fontFamily(400), fontSize: 16, color: colors.text } as TextStyle,
  bodyMuted: { ...fontFamily(400), fontSize: 15, color: colors.textMuted } as TextStyle,
  button: { ...fontFamily(800), fontSize: 15, letterSpacing: 0.5 } as TextStyle,
  /** Chapter content - learners read Swedish here; size and line height first. */
  reading: { ...fontFamily(400), fontSize: 18, lineHeight: 30, color: colors.text } as TextStyle,
} as const;

/**
 * The signature "chunky 3D" button shape: a flat fill with a darker
 * bottom edge that disappears while pressed (the button "pushes in").
 */
export type ButtonVariant = 'green' | 'blue' | 'ghost' | 'locked' | 'danger';

export function buttonStyles(variant: ButtonVariant): {
  container: ViewStyle;
  containerPressed: ViewStyle;
  text: TextStyle;
} {
  const base: ViewStyle = {
    borderRadius: radius.m,
    paddingVertical: 14,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  };

  const pressed: ViewStyle = { borderBottomWidth: 0, paddingBottom: 18 };

  switch (variant) {
    case 'green':
      return {
        container: { ...base, backgroundColor: colors.green, borderBottomColor: colors.greenEdge },
        containerPressed: pressed,
        text: { ...typography.button, color: colors.white },
      };
    case 'blue':
      return {
        container: { ...base, backgroundColor: colors.blue, borderBottomColor: colors.blueEdge },
        containerPressed: pressed,
        text: { ...typography.button, color: colors.white },
      };
    case 'danger':
      return {
        container: { ...base, backgroundColor: colors.red, borderBottomColor: colors.redEdge },
        containerPressed: pressed,
        text: { ...typography.button, color: colors.white },
      };
    case 'locked':
      return {
        container: { ...base, backgroundColor: colors.lockedBg, borderBottomColor: colors.lockedEdge },
        containerPressed: { borderBottomWidth: 4 },
        text: { ...typography.button, color: colors.lockedText },
      };
    case 'ghost':
      return {
        container: {
          ...base,
          backgroundColor: colors.white,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: colors.border,
        },
        containerPressed: pressed,
        text: { ...typography.button, color: colors.blue },
      };
  }
}
