// Desktop configuration constants
export const DESKTOP_CONFIG = {
  GRID_SIZE: 80,
  PADDING: 16,
  DRAG_THRESHOLD: 5,
  ICON_SIZE: 80,
  ICON_SIZES: {
    xs: 'text-2xl',
    sm: 'text-3xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  },
  BREAKPOINTS: {
    xs: 640,
    sm: 768,
    md: 1024
  },
  PATHS: {
    DESKTOP: 'C:\\System\\Desktop',
    DRIVE: 'C'
  },
  ANIMATION: {
    DRAG_OPACITY: 0.5,
    DRAG_SCALE: 0.95,
    TRANSITION_DURATION: '150ms'
  }
} as const;

export type IconSize = keyof typeof DESKTOP_CONFIG.ICON_SIZES;
