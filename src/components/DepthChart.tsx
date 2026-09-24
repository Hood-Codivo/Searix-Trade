import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '@/theme';
import type { OrderLevel } from '@/types/market';

function cumulative(levels: OrderLevel[]) {
  let total = 0;
  return levels.map((level) => ({ ...level, cumulative: total += level.size }));
}

export function DepthChart({ bids, asks, width, height = 150 }: { bids: OrderLevel[]; asks: OrderLevel[]; width: number; height?: number }) {
  const bidLevels = cumulative(bids);
  const askLevels = cumulative(asks);
  const max = Math.max(bidLevels.at(-1)?.cumulative ?? 1, askLevels.at(-1)?.cumulative ?? 1);
  const half = width / 2;
  const bidPath = bidLevels.map((level, i) => `${i ? 'L' : 'M'} ${half - (i / (bidLevels.length - 1)) * (half - 8)} ${height - (level.cumulative / max) * (height - 18)}`).join(' ');
  const askPath = askLevels.map((level, i) => `${i ? 'L' : 'M'} ${half + (i / (askLevels.length - 1)) * (half - 8)} ${height - (level.cumulative / max) * (height - 18)}`).join(' ');
  return <View>
    <Svg accessibilityLabel="Cumulative bid and ask depth" height={height} width={width}>
      <Defs><LinearGradient id="bidFade" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={colors.green} stopOpacity="0.3" /><Stop offset="1" stopColor={colors.green} stopOpacity="0.04" /></LinearGradient><LinearGradient id="askFade" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={colors.red} stopOpacity="0.3" /><Stop offset="1" stopColor={colors.red} stopOpacity="0.04" /></LinearGradient></Defs>
      <Path d={`${bidPath} L 8 ${height} L ${half} ${height} Z`} fill="url(#bidFade)" stroke={colors.green} strokeWidth={2} />
      <Path d={`${askPath} L ${width - 8} ${height} L ${half} ${height} Z`} fill="url(#askFade)" stroke={colors.red} strokeWidth={2} />
    </Svg>
    <View style={styles.legend}><Text style={[styles.legendText, { color: colors.green }]}>Bids</Text><Text style={styles.mid}>MID</Text><Text style={[styles.legendText, { color: colors.red }]}>Asks</Text></View>
  </View>;
}

const styles = StyleSheet.create({ legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }, legendText: { fontFamily: font.sansMedium, fontSize: 11 }, mid: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 10 } });
