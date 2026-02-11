export const Colors = {
  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  elevated: '#334155',

  // Gradient
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Borders
  border: '#334155',
  borderLight: '#475569',

  // Inputs
  inputBackground: '#1E293B',
  inputBorder: '#334155',

  // Primary
  primary: '#6366F1',
  primaryLight: '#818CF8',

  // Status
  success: '#34D399',
  successMuted: 'rgba(52,211,153,0.15)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251,191,36,0.15)',
  danger: '#F87171',
  dangerMuted: 'rgba(248,113,113,0.15)',

  // Overlay
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export const Gradient = [Colors.gradientStart, Colors.gradientEnd] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
  hero: 36,
} as const;
