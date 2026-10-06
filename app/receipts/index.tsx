import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { ReceiptCard } from '@/components/ReceiptCard';
import { useReceipts } from '@/hooks/useMarkets';
import { colors, font, spacing } from '@/theme';

// Every saved analysis, newest first. Long lists scroll here instead of on the profile.
export default function AllReceiptsScreen() {
  const { data, loading, error, retry } = useReceipts();
  useFocusEffect(useCallback(() => { void retry(); }, [retry]));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.title}>Analysis receipts</Text>
        <Text style={styles.count}>{data.length}</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.content}
        data={loading || error ? [] : data}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        ListEmptyComponent={
          loading ? <ActivityIndicator color={colors.amber} />
          : <Text style={styles.copy}>{error ?? 'No analysis receipts yet.'}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  back: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  title: { color: colors.text, flex: 1, fontFamily: font.sansSemiBold, fontSize: 20 },
  count: { color: colors.textSubtle, fontFamily: font.monoMedium, fontSize: 13 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  copy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, marginTop: spacing.lg, textAlign: 'center' },
});
