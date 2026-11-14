/**
 * Design system tokens for TripPlanner.
 * Serves as the single source of truth for color values, typography,
 * shadows, and border radii across the application.
 */

export const TOKENS = {
  // Brand colors
  colors: {
    primary: {
      light: '#F59E0B', // Amber 500
      DEFAULT: '#D97706', // Amber 600 (Sunset Amber)
      dark: '#B45309', // Amber 700
      deep: '#92400E', // Amber 800
      gradientStart: '#D97706',
      gradientEnd: '#78350F',
    },
    accent: {
      success: {
        bg: '#ECFDF5', // Emerald 50
        border: '#A7F3D0', // Emerald 200
        text: '#047857', // Emerald 700
        DEFAULT: '#10B981', // Emerald 500
      },
      pending: {
        bg: '#FFFBEB', // Amber 50
        border: '#FDE68A', // Amber 200
        text: '#B45309', // Amber 700
        DEFAULT: '#F59E0B', // Amber 500
      },
      error: {
        bg: '#FEF2F2', // Red 50
        border: '#FCA5A5', // Red 200
        text: '#B91C1C', // Red 700
        DEFAULT: '#EF4444', // Red 500
      },
      info: {
        bg: '#F0F9FF', // Sky 50
        border: '#BAE6FD', // Sky 200
        text: '#0369A1', // Sky 700
        DEFAULT: '#0EA5E9', // Sky 500
      },
    },
    neutral: {
      appBg: '#F8F9FB', // Very light gray app background
      cardBg: '#FFFFFF', // White card surface
      border: '#E5E7EB', // Slate border (gray 200)
      borderHover: '#D1D5DB', // gray 300
      textPrimary: '#111827', // Slate 900
      textSecondary: '#6B7280', // Muted gray 500
      textMuted: '#9CA3AF', // Disabled/placeholder gray 400
    },
  },

  // Typography hierarchy guidelines
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    sizes: {
      pageTitle: 'text-3xl font-bold tracking-tight', // 24-28px
      sectionTitle: 'text-xl font-semibold tracking-tight', // 18-20px
      body: 'text-sm font-normal leading-relaxed', // 14px
      caption: 'text-xs font-medium text-gray-500', // 12px
    },
  },

  // Borders & Shadow styles
  effects: {
    radius: 'rounded-2xl', // 16px - 20px radius for cards
    radiusButton: 'rounded-xl', // 12px for buttons
    radiusBadge: 'rounded-full', // full pills
    shadow: 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]', // soft subtle shadow
    shadowSm: 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]',
  },
} as const;
