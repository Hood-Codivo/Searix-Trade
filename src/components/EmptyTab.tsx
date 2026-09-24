import type { LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '@/theme';

export function EmptyTab({ Icon, title, copy, action }: { Icon: LucideIcon; title: string; copy: string; action: string }) {
  return <SafeAreaView style={styles.safe}><View style={styles.wrap}><View style={styles.icon}><Icon color={colors.amber} size={25} /></View><Text style={styles.title}>{title}</Text><Text style={styles.copy}>{copy}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{action}</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.canvas, flex: 1 }, wrap: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xxl }, icon: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.pill, height: 56, justifyContent: 'center', marginBottom: spacing.lg, width: 56 }, title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20 }, copy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 300, textAlign: 'center' }, button: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, justifyContent: 'center', marginTop: spacing.xl, minHeight: 44, paddingHorizontal: spacing.lg }, pressed: { backgroundColor: colors.elevated, transform: [{ translateY: 1 }] }, buttonText: { color: colors.text, fontFamily: font.sansMedium, fontSize: 14 } });
