/**
 * Bird App design tokens — backward-compatible export surface.
 *
 * Architecture:
 *   primitives.ts  → raw palette (theme-invariant)
 *   semantic.ts    → content / border / surface (light + dark)
 *   components.ts  → button / input / card / … (light + dark)
 *
 * Prefer `getSemanticColors(mode)` or `theme.colors` in product UI.
 */

import { PRIMITIVES, BRAND2_BORDER_ALPHA } from "./primitives";
import {
  SEMANTIC_LIGHT,
  toLegacyBorderTokens,
  toLegacySurfaceTokens,
  toLegacyTextTokens,
} from "./semantic";
import { darkThemeTokens } from "../../theme/colors/dark";

export { PRIMITIVES, BRAND2_BORDER_ALPHA } from "./primitives";
export {
  SEMANTIC_LIGHT,
  SEMANTIC_DARK,
  getSemanticColors,
  toLegacyTextTokens,
  toLegacyBorderTokens,
  toLegacySurfaceTokens,
} from "./semantic";
export {
  COMPONENT_LIGHT,
  COMPONENT_DARK,
  getComponentColors,
} from "./components";

/** @deprecated Prefer SEMANTIC_DARK or darkColors */
export const FIGMA_DARK_TOKENS = darkThemeTokens;

/** @deprecated Prefer darkColors from src/theme/colors */
export { darkColors as DarkTheme } from "../../theme/colors/dark";

const lightText = toLegacyTextTokens(SEMANTIC_LIGHT);
const lightBorder = toLegacyBorderTokens(SEMANTIC_LIGHT);
const lightSurface = toLegacySurfaceTokens(SEMANTIC_LIGHT);

/** Light-mode tokens + primitives (legacy FIGMA_TOKENS shape) */
export const FIGMA_TOKENS = {
  grey: PRIMITIVES.grey,
  brand1: PRIMITIVES.brand1,
  brand2: {
    ...PRIMITIVES.brand2,
    /** Legacy alias — dark semantic brand2 peach (#FCB182) */
    light2: "#FCB182",
    text: "#21190B",
    light1: BRAND2_BORDER_ALPHA,
  },
  semantic: {
    success: SEMANTIC_LIGHT.content.success,
    error: SEMANTIC_LIGHT.content.error,
    warning: SEMANTIC_LIGHT.content.warning,
    link: SEMANTIC_LIGHT.content.link,
  },
  surface: lightSurface,
  text: lightText,
  border: lightBorder,
  green: PRIMITIVES.green,
  red: PRIMITIVES.red,
  yellow: PRIMITIVES.yellow,
  orange: PRIMITIVES.orange,
  blue: PRIMITIVES.blue,
  radius: {
    popup: 16,
    button: 360,
  },
  dark: FIGMA_DARK_TOKENS,
  /** Unified semantic aliases */
  content: SEMANTIC_LIGHT.content,
} as const;

export type FigmaTokens = typeof FIGMA_TOKENS;
