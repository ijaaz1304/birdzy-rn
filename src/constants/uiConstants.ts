/**
 * UI Constants - Common UI dimensions, hit slops, and spacing
 * Centralize all touch targets, spacing, and layout measurements
 */

/** Hit slop for touchable areas - standard sizes for accessibility */
export const HIT_SLOP = {
  /** Standard close button hit slop: 12px padding */
  CLOSE: { top: 12, bottom: 12, left: 12, right: 12 } as const,
  /** Larger hit slop for icon buttons: 16px padding */
  LARGE: { top: 16, bottom: 16, left: 16, right: 16 } as const,
  /** Small hit slop for compact buttons: 8px padding */
  SMALL: { top: 8, bottom: 8, left: 8, right: 8 } as const,
} as const;

/** Common spacing and dimensions */
export const SPACING = {
  /** Standard padding/margin: 4px */
  XS: 4,
  /** Small padding/margin: 8px */
  SM: 8,
  /** Medium padding/margin: 12px */
  MD: 12,
  /** Standard padding/margin: spacing[4]px */
  LG: 16,
  /** Large padding/margin: 20px */
  XL: 20,
  /** Extra large padding/margin: 24px */
  XXL: 24,
  /** Large padding/margin: 32px */
  XXXL: 32,
} as const;

/** Common border radius values */
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  FULL: 9999,
} as const;

/** Font sizes */
export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  XXXL: 24,
  XXXXL: 32,
} as const;

/** Line heights */
export const LINE_HEIGHTS = {
  TIGHT: 1.2,
  NORMAL: 1.5,
  RELAXED: 1.75,
  LOOSE: 2,
} as const;

/** Common shadow configurations */
export const SHADOWS = {
  NONE: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  SM: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  MD: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  LG: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/** Opacity values for common use cases */
export const OPACITY = {
  DISABLED: 0.5,
  HOVER: 0.8,
  ACTIVE: 1,
  SUBTLE: 0.1,
  LIGHT: 0.2,
  MEDIUM: 0.4,
  DARK: 0.6,
  VERY_DARK: 0.8,
} as const;
