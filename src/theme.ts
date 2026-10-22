// Light theme, matching the reference design exactly: lavender-white canvas, white cards,
// indigo/violet as the primary accent (token names kept as `amber*` since that's what every
// component already calls "the brand accent" -- only the values changed).
export const lightColors = {
  canvas: '#F2F3FA',
  surface: '#FFFFFF',
  elevated: '#F6F6FC',
  border: '#ECEDF6',
  borderStrong: '#DCDEEA',
  text: '#15161F',
  textMuted: '#8B8D9F',
  textSubtle: '#B2B4C4',
  amber: '#6D5DF6',
  amberSoft: '#EDEBFE',
  green: '#22C55E',
  greenSoft: '#E7F9EE',
  red: '#EF4444',
  redSoft: '#FDEBEB',
  blue: '#3B82F6',
  overlay: 'rgba(20, 21, 31, 0.45)',
  amberGlow: 'rgba(109, 93, 246, 0.14)',
  greenGlow: 'rgba(34, 197, 94, 0.12)',
  whiteSoft: 'rgba(21, 22, 31, 0.045)',
  gradientStart: '#5B4FE8',
  gradientEnd: '#8B7CF7',
  canvasInverse: '#12141A',
  textInverse: '#F4F1E8',
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

// Dark counterpart: same token names/shape as `lightColors` so a component only ever needs one
// `colors` value from `useTheme()` and never branches on scheme itself.
export const darkColors: ThemeColors = {
  canvas: '#0E0F16',
  surface: '#171822',
  elevated: '#1D1F2B',
  border: '#272938',
  borderStrong: '#363850',
  text: '#F2F2F7',
  textMuted: '#9496AC',
  textSubtle: '#6B6D83',
  amber: '#8B7CF7',
  amberSoft: '#2A2550',
  green: '#34D399',
  greenSoft: '#123327',
  red: '#F87171',
  redSoft: '#3A1D1F',
  blue: '#60A5FA',
  overlay: 'rgba(0, 0, 0, 0.6)',
  amberGlow: 'rgba(139, 124, 247, 0.18)',
  greenGlow: 'rgba(52, 211, 153, 0.16)',
  whiteSoft: 'rgba(255, 255, 255, 0.06)',
  gradientStart: '#6D5DF6',
  gradientEnd: '#8B7CF7',
  canvasInverse: '#F2F3FA',
  textInverse: '#15161F',
};

export type ColorScheme = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

// Soft elevation for cards -- cross-platform (shadow* for iOS/web, elevation for Android). Kept
// subtle and consistent so depth reads as one system rather than per-card guesswork. Shadows read
// fine unchanged in dark mode too (low opacity, barely visible either way), so these stay static.
export const shadow = {
  card: {
    shadowColor: '#2B2D66',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  raised: {
    shadowColor: '#2B2D66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

// Token names kept as `sans*`/`mono*` so every existing component keeps working unchanged --
// both now point at Plus Jakarta Sans, matching the reference design's single rounded typeface
// (no separate monospace family in that design).
export const font = {
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtraBold: 'PlusJakartaSans_800ExtraBold',
  mono: 'PlusJakartaSans_500Medium',
  monoMedium: 'PlusJakartaSans_600SemiBold',
} as const;
