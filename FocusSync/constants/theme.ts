export const fontFamilies = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const colors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  secondary: '#64748B',
  danger: '#EF4444',
  dangerHover: '#DC2626',
  success: '#22C55E',
  warning: '#F59E0B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  cardBackground: '#1E293B',
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputFocusBorder: '#6366F1',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  xs: { fontFamily: fontFamilies.regular, fontSize: 12, lineHeight: 16 },
  sm: { fontFamily: fontFamilies.regular, fontSize: 14, lineHeight: 20 },
  md: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  lg: { fontFamily: fontFamilies.regular, fontSize: 18, lineHeight: 28 },
  xl: { fontFamily: fontFamilies.regular, fontSize: 20, lineHeight: 28 },
  '2xl': { fontFamily: fontFamilies.regular, fontSize: 24, lineHeight: 32 },
  '3xl': { fontFamily: fontFamilies.regular, fontSize: 30, lineHeight: 36 },
  '4xl': { fontFamily: fontFamilies.regular, fontSize: 36, lineHeight: 44 },
  '5xl': { fontFamily: fontFamilies.regular, fontSize: 48, lineHeight: 56 },
  '6xl': { fontFamily: fontFamilies.regular, fontSize: 60, lineHeight: 72 },
  '7xl': { fontFamily: fontFamilies.regular, fontSize: 72, lineHeight: 80 },
};

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
};
