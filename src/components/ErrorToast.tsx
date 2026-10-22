import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { font, radius, shadow, spacing } from '@/theme';

const AUTO_DISMISS_MS = 6_000;

// Shows the real error message as a toast. Remount it (change `key`) for each new error so it
// reappears even when the message repeats. Tap it to dismiss early.
export function ErrorToast({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Pressable accessibilityRole="alert" onPress={() => setVisible(false)} style={styles.toast}>
      <ShieldAlert color={colors.red} size={18} />
      <Text style={styles.message}>{message}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  toast: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.red, borderRadius: radius.md, borderWidth: 1, bottom: spacing.lg, flexDirection: 'row', gap: spacing.sm, left: spacing.md, padding: spacing.md, position: 'absolute', right: spacing.md, zIndex: 50, ...shadow.card },
  message: { color: colors.text, flex: 1, fontFamily: font.sansMedium, fontSize: 13, lineHeight: 18 },
});
