/**
 * Dark mode semantic colors — Bird App design system.
 * Sourced from design-system/colors/semantic.ts (SEMANTIC_DARK).
 */

import {
  SEMANTIC_DARK,
  toLegacyBorderTokens,
  toLegacySurfaceTokens,
  toLegacyTextTokens,
} from "../../design-system/colors/semantic";
import { APP_COLORS } from "../../../theme/colors";

/** Figma Surface-brand-1 — primary CTA fill, selected dots, brand surfaces */
export const DARK_SURFACE_BRAND_1 = SEMANTIC_DARK.surface.brand1;

const darkText = toLegacyTextTokens(SEMANTIC_DARK);
const darkBorder = toLegacyBorderTokens(SEMANTIC_DARK);
const darkSurface = toLegacySurfaceTokens(SEMANTIC_DARK);

export const darkColors = {
  /** Unified content scale (text + icons) */
  content: SEMANTIC_DARK.content,

  text: {
    ...darkText,
    brand: darkText.brand1,
    brandInvert: darkText.brand1Invert,
    invert: darkText.invert,
    /** Primary CTA button fill in dark mode */
    primaryCTA: APP_COLORS.ctaPrimary,
  },

  border: {
    ...darkBorder,
    brand: darkBorder.brand,
    brandInvert: darkBorder.brandInverse,
    default: darkBorder.zero,
  },

  surface: {
    ...darkSurface,
    brand: darkSurface.brand1,
    brandAccent: darkSurface.brand1Accent,
    invert: darkSurface.invert,
  },
} as const;

export type DarkColors = typeof darkColors;

/** Legacy brand1 / none keys for design-system mappings */
export const darkThemeTokens = {
  content: SEMANTIC_DARK.content,
  text: {
    ...darkText,
    brand1: darkText.brand1,
    brand: darkText.brand1,
    brand1Invert: darkText.brand1Invert,
    brand2: darkSurface.brand2,
  },
  border: darkBorder,
  surface: darkSurface,
} as const;
