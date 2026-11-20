/**
 * Font family names (Satoshi) for use with fontFamily in styles.
 * Re-exported or referenced by design-system/typography.
 */

export const FONTS = {
  black: "Satoshi-Black",
  bold: "Satoshi-Bold",
  medium: "Satoshi-Medium",
  regular: "Satoshi-Regular",
} as const;

/**
 * Build A from the typography report.
 * Final size = Figma size × system font scale.
 * Scale 1 (default font and display settings) keeps the Figma size.
 * Screen width is not an input. The system font scale is not capped.
 */
export function getAccessibilityFontScale(fontScale: number): number {
  if (!Number.isFinite(fontScale) || fontScale <= 0) return 1;
  return fontScale;
}

/** Figma font size or line height × the system font scale. Rounded to a whole pixel. */
export function scaleFigmaFontSize(figmaSize: number, fontScale: number): number {
  if (!Number.isFinite(figmaSize) || figmaSize <= 0) return figmaSize;
  return Math.round(figmaSize * getAccessibilityFontScale(fontScale));
}
