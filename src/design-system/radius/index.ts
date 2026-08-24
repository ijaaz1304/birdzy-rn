/**
 * Border radius tokens
 * Design spec (05 Corner Radius): Card 12px, Button 360px, Textfield 360px
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  /** Card Corner Radius – design spec 12px */
  card: 12,
  /** Button/CTA Corner Radius – design spec 28px for all CTAs */
  button: 28,
  /** Textfield Corner Radius – design spec 360px (pill) */
  textfield: 360,
  /** Pill/circle – backward compatibility */
  pill: 100,
  full: 9999,
} as const;

export type RadiusToken = typeof radius;
