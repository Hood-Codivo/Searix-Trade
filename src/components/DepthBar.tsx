import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

export function DepthBar({ imbalance }: { imbalance: number }) {
  const bid = Math.max(8, Math.min(92, imbalance * 100));
  return (
    <View accessibilityLabel={`${Math.round(bid)} percent bid-side depth`} style={styles.track}>
      <View style={[styles.bid, { flex: bid }]} />
      <View style={[styles.ask, { flex: 100 - bid }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.elevated, borderRadius: radius.pill, flexDirection: 'row', gap: 2, height: 4, overflow: 'hidden', width: 72 },
  bid: { backgroundColor: colors.green },
  ask: { backgroundColor: colors.red },
});
