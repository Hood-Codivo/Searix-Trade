import { StyleSheet, Switch, Text, View } from 'react-native';
import { Moon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { font, radius, spacing } from '@/theme';

// On/off for light vs dark mode. Local-only, same as app-lock: no wallet needed, applies instantly
// across the whole app since every screen reads its colors from useTheme().
export function ThemeToggle() {
  const { colors, isDark, toggleScheme } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWell}><Moon color={colors.amber} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.title}>Dark mode</Text>
          <Text style={styles.copy}>{isDark ? 'Dark theme is on.' : 'Switch to a dark color scheme.'}</Text>
        </View>
        <Switch onValueChange={toggleScheme} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.amber }} value={isDark} />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconWell: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  flex: { flex: 1 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  copy: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
});
