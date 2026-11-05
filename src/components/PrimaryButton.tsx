import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { buttonStyles, colors, radius, spacing, type ButtonVariant } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Chunky "3D" Vocabula button: flat fill with a darker bottom edge that
 * collapses while pressed, mimicking the button pushing in.
 * A disabled button renders in the locked grey style.
 */
export default function PrimaryButton({ title, onPress, variant = 'green', disabled = false, style }: Props) {
  const styles = buttonStyles(disabled ? 'locked' : variant);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed, style]}
    >
      <Text style={styles.text}>{title.toUpperCase()}</Text>
    </Pressable>
  );
}

/** White card with a soft border - the basic surface of content blocks. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.l,
    padding: spacing.m,
  },
});
