/**
 * Bird App — Semantic color tokens (Light + Dark)
 *
 * Product UI should consume these — not raw primitives.
 * `content.*` is shared by text and icons (no duplicate text/icon scales).
 */

import {
  BRAND1_ACCENT_SURFACE,
  BRAND2_BORDER_ALPHA,
  PRIMITIVES as P,
} from "./primitives";

export const SEMANTIC_LIGHT = {
  content: {
    primary: P.grey[950],
    secondary: P.grey[600],
    tertiary: P.grey[400],
    quaternary: P.grey[100],
    brand1: P.brand1.primary,
    brand1Inverse: P.brand1.light1,
    brand2: P.brand1.dark3,
    inverse: P.grey.white,
    error: P.red[500],
    success: P.green[500],
    warning: P.yellow[600],
    disabled: P.grey[300],
    link: P.blue.primary,
  },
  border: {
    primary: P.grey[300],
    secondary: P.grey[400],
    tertiary: P.grey[500],
    brand: P.brand1.primary,
    brandInverse: P.brand1.primary,
    brand2: BRAND2_BORDER_ALPHA,
    error: P.red[500],
    success: P.green[500],
    zero: P.grey[100],
  },
  surface: {
    primary: P.grey.white,
    secondary: P.grey[50],
    tertiary: P.grey[300],
    inverse: P.grey[950],
    brand1: P.brand1.primary,
    brand1Accent: P.brand1.light1,
    brand2: P.brand2.primary,
    brand2Accent: P.brand2.light1,
    success: P.green[50],
    error: P.red[50],
    warning: P.yellow[20],
    disabled: P.grey[200],
  },
} as const;

export const SEMANTIC_DARK = {
  content: {
    primary: P.grey.white,
    secondary: P.grey[200],
    tertiary: P.grey[400],
    quaternary: P.grey[100],
    brand1: P.brand1.light2,
    brand1Inverse: P.brand1.primary,
    brand2: "#FCB182",
    inverse: P.grey[950],
    error: P.red[500],
    success: P.green[600],
    warning: P.yellow[600],
    disabled: P.grey[500],
    link: P.blue.primary,
  },
  border: {
    primary: P.grey[800],
    secondary: P.grey[700],
    tertiary: P.grey[200],
    brand: "#EECCA6",
    brandInverse: "#742B7E",
    brand2: BRAND2_BORDER_ALPHA,
    error: P.red[500],
    success: P.green[800],
    zero: P.grey[800],
  },
  surface: {
    primary: P.grey[950],
    secondary: P.grey[920],
    tertiary: P.grey[910],
    inverse: P.grey[50],
    brand1: "#F8E5B4",
    brand1Accent: BRAND1_ACCENT_SURFACE,
    brand2: "#FCB182",
    brand2Accent: BRAND1_ACCENT_SURFACE,
    success: P.green[800],
    error: P.red[950],
    warning: P.orange[500],
    disabled: P.grey[900],
  },
} as const;

export type SemanticColors = typeof SEMANTIC_LIGHT;
export type ThemeSemantic = SemanticColors | typeof SEMANTIC_DARK;

export const getSemanticColors = (
  mode: "light" | "dark"
): ThemeSemantic => (mode === "dark" ? SEMANTIC_DARK : SEMANTIC_LIGHT);

/** Legacy aliases — text/icon both map to content */
export const toLegacyTextTokens = (semantic: ThemeSemantic) => ({
  ...semantic.content,
  brand1Invert: semantic.content.brand1Inverse,
  invert: semantic.content.inverse,
});

export const toLegacyBorderTokens = (semantic: ThemeSemantic) => ({
  ...semantic.border,
  none: semantic.border.zero,
});

export const toLegacySurfaceTokens = (semantic: ThemeSemantic) => ({
  ...semantic.surface,
  brand1: semantic.surface.brand1,
  brand1Accent: semantic.surface.brand1Accent,
  invert: semantic.surface.inverse,
});
