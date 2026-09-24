import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '@/theme';
import { formatPrice } from '@/utils/format';

function pathFor(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const divisor = values.length - 1 || 1;
  return values.map((value, index) => {
    const x = 8 + (index / divisor) * (width - 16);
    const y = height - 14 - ((value - min) / range) * (height - 32);
    return { x, y, command: `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}` };
  });
}

const BUBBLE_WIDTH = 74;

export function PriceChart({ values, width, height = 210 }: { values: number[]; width: number; height?: number }) {
  if (values.length === 0) {
    return (
      <View accessibilityLabel="Recent market price chart" style={{ alignItems: 'center', height, justifyContent: 'center' }}>
        <Text style={{ color: colors.textSubtle, fontFamily: font.sans, fontSize: 12 }}>Not enough data for this range yet.</Text>
      </View>
    );
  }
  // A single observed price can't draw a line; render it flat so the chart still shows something real.
  const points = pathFor(values.length === 1 ? [values[0], values[0]] : values, width, height);
  const path = points.map((point) => point.command).join(' ');
  const last = points[points.length - 1];
  // Clamp so the price bubble never overflows the chart's horizontal bounds near either edge.
  const bubbleLeft = Math.min(Math.max(last.x - BUBBLE_WIDTH / 2, 0), width - BUBBLE_WIDTH);
  const bubbleTop = Math.max(last.y - 40, 0);
  return (
    <View accessibilityLabel="Recent market price chart" style={{ height, width }}>
      <Svg height={height} width={width}>
        <Defs><LinearGradient id="chartFade" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={colors.amber} stopOpacity="0.24" /><Stop offset="1" stopColor={colors.amber} stopOpacity="0" /></LinearGradient></Defs>
        {[0.25, 0.5, 0.75].map((ratio) => <Line key={ratio} stroke={colors.border} strokeDasharray="3 6" strokeWidth={1} x1="8" x2={width - 8} y1={height * ratio} y2={height * ratio} />)}
        <Path d={`${path} L ${last.x} ${height} L 8 ${height} Z`} fill="url(#chartFade)" />
        <Path d={path} fill="none" stroke={colors.amber} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
        <Circle cx={last.x} cy={last.y} fill={colors.canvas} r={5} stroke={colors.amber} strokeWidth={2.5} />
      </Svg>
      <View pointerEvents="none" style={[styles.bubble, { left: bubbleLeft, top: bubbleTop, width: BUBBLE_WIDTH }]}>
        <Text style={styles.bubbleText}>{formatPrice(values[values.length - 1])}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingVertical: 5,
    position: 'absolute',
  },
  bubbleText: { color: colors.text, fontFamily: font.monoMedium, fontSize: 11, fontVariant: ['tabular-nums'] },
});
