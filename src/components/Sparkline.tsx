import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/theme';

function linePath(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

export function Sparkline({ values, width = 92, height = 36, positive = true }: { values: number[]; width?: number; height?: number; positive?: boolean }) {
  const tone = positive ? colors.green : colors.red;
  const path = linePath(values, width, height);
  return (
    <Svg accessibilityLabel={`${positive ? 'Rising' : 'Falling'} price trend`} height={height} width={width}>
      <Defs><LinearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={tone} stopOpacity="0.28" /><Stop offset="1" stopColor={tone} stopOpacity="0" /></LinearGradient></Defs>
      <Path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#fade)" />
      <Path d={path} fill="none" stroke={tone} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}
