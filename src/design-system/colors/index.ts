import {
  FIGMA_TOKENS,
  PRIMITIVES,
  SEMANTIC_LIGHT,
  SEMANTIC_DARK,
} from "./figmaTokens";

export {
  FIGMA_TOKENS,
  FIGMA_DARK_TOKENS,
  DarkTheme,
  PRIMITIVES,
  SEMANTIC_LIGHT,
  SEMANTIC_DARK,
  COMPONENT_LIGHT,
  COMPONENT_DARK,
  getSemanticColors,
  getComponentColors,
} from "./figmaTokens";
export { darkColors, darkThemeTokens, flatDarkColors } from "../../theme/colors";
export type { DarkColors, FlatDarkColors } from "../../theme/colors";
export type { FigmaTokens } from "./figmaTokens";
export type { Primitives } from "./primitives";
export type { SemanticColors, ThemeSemantic } from "./semantic";
export type { ComponentColors } from "./components";

/**
 * Color tokens for the design system
 * Based on the provided DARK_COLORS, LIGHT_COLORS, and PRIMITIVE_COLORS structure
 */

export const DARK_COLORS = {
  /* =======================
     CONTENT (text + icon)
     ======================= */
  text: {
    primary: {
      token: "content.primary",
      base: "grey.white",
      hex: SEMANTIC_DARK.content.primary,
      hue: "grey",
    },
    secondary: {
      token: "content.secondary",
      base: "grey.200",
      hex: SEMANTIC_DARK.content.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "content.tertiary",
      base: "grey.400",
      hex: SEMANTIC_DARK.content.tertiary,
      hue: "grey",
    },
    quaternary: {
      token: "content.quaternary",
      base: "grey.100",
      hex: SEMANTIC_DARK.content.quaternary,
      hue: "grey",
    },
    disabled: {
      token: "content.disabled",
      base: "grey.500",
      hex: SEMANTIC_DARK.content.disabled,
      hue: "grey",
    },
    invert: {
      token: "content.inverse",
      base: "grey.950",
      hex: SEMANTIC_DARK.content.inverse,
      hue: "grey",
    },
    brand1: {
      token: "content.brand1",
      base: "brand1.light2",
      hex: SEMANTIC_DARK.content.brand1,
      hue: "orange",
    },
    brand1Invert: {
      token: "content.brand1Inverse",
      base: "brand1.primary",
      hex: SEMANTIC_DARK.content.brand1Inverse,
      hue: "orange",
    },
    brand2: {
      token: "content.brand2",
      base: "brand2.light2",
      hex: SEMANTIC_DARK.content.brand2,
      hue: "brown",
    },
    success: {
      token: "content.success",
      base: "green.600",
      hex: SEMANTIC_DARK.content.success,
      hue: "green",
    },
    warning: {
      token: "content.warning",
      base: "yellow.600",
      hex: SEMANTIC_DARK.content.warning,
      hue: "yellow",
    },
    error: {
      token: "content.error",
      base: "red.500",
      hex: SEMANTIC_DARK.content.error,
      hue: "red",
    },
    link: {
      token: "content.link",
      base: "blue.primary",
      hex: SEMANTIC_DARK.content.link,
      hue: "blue",
    },
  },

  /* =======================
     BORDER
     ======================= */
  border: {
    primary: {
      token: "border.primary",
      base: "grey.800",
      hex: SEMANTIC_DARK.border.primary,
      hue: "grey",
    },
    secondary: {
      token: "border.secondary",
      base: "grey.700",
      hex: SEMANTIC_DARK.border.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "border.tertiary",
      base: "grey.200",
      hex: SEMANTIC_DARK.border.tertiary,
      hue: "grey",
    },
    none: {
      token: "border.zero",
      base: "grey.800",
      hex: SEMANTIC_DARK.border.zero,
      hue: "grey",
    },
    brand: {
      token: "border.brand",
      base: "brand1.dark3",
      hex: SEMANTIC_DARK.border.brand,
      hue: "orange",
    },
    brandInvert: {
      token: "border.brandInverse",
      base: "brand1.primary",
      hex: SEMANTIC_DARK.border.brandInverse,
      hue: "orange",
    },
    brand2: {
      token: "border.brand2",
      base: "brand2.light1",
      hex: SEMANTIC_DARK.border.brand2,
      hue: "brown",
    },
    success: {
      token: "border.success",
      base: "green.800",
      hex: SEMANTIC_DARK.border.success,
      hue: "green",
    },
    error: {
      token: "border.error",
      base: "red.500",
      hex: SEMANTIC_DARK.border.error,
      hue: "red",
    },
  },

  /* =======================
     SURFACE
     ======================= */
  surface: {
    primary: {
      token: "surface.primary",
      base: "grey.950",
      hex: SEMANTIC_DARK.surface.primary,
      hue: "grey",
    },
    secondary: {
      token: "surface.secondary",
      base: "grey.920",
      hex: SEMANTIC_DARK.surface.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "surface.tertiary",
      base: "grey.910",
      hex: SEMANTIC_DARK.surface.tertiary,
      hue: "grey",
    },
    invert: {
      token: "surface.inverse",
      base: "grey.50",
      hex: SEMANTIC_DARK.surface.inverse,
      hue: "grey",
    },
    disabled: {
      token: "surface.disabled",
      base: "grey.900",
      hex: SEMANTIC_DARK.surface.disabled,
      hue: "grey",
    },
    brand1: {
      token: "surface.brand1",
      base: "brand1.light2",
      hex: SEMANTIC_DARK.surface.brand1,
      hue: "orange",
    },
    brand1Accent: {
      token: "surface.brand1Accent",
      base: "brand1.dark3",
      hex: SEMANTIC_DARK.surface.brand1Accent,
      hue: "orange",
    },
    brand2: {
      token: "surface.brand2",
      base: "brand2.light2",
      hex: SEMANTIC_DARK.surface.brand2,
      hue: "brown",
    },
    brand2Accent: {
      token: "surface.brand2Accent",
      base: "brand2.dark3",
      hex: SEMANTIC_DARK.surface.brand2Accent,
      hue: "brown",
    },
    brand2Variant: {
      token: "surface.brand2Variant",
      base: "brand2.dark4",
      hex: PRIMITIVES.brand2.dark4,
      hue: "brown",
    },
    success: {
      token: "surface.success",
      base: "green.800",
      hex: SEMANTIC_DARK.surface.success,
      hue: "green",
    },
    warning: {
      token: "surface.warning",
      base: "orange.500",
      hex: SEMANTIC_DARK.surface.warning,
      hue: "orange",
    },
    error: {
      token: "surface.error",
      base: "red.950",
      hex: SEMANTIC_DARK.surface.error,
      hue: "red",
    },
  },
} as const;

export const LIGHT_COLORS = {
  text: {
    primary: {
      token: "content.primary",
      base: "grey.950",
      hex: SEMANTIC_LIGHT.content.primary,
      hue: "grey",
    },
    secondary: {
      token: "content.secondary",
      base: "grey.600",
      hex: SEMANTIC_LIGHT.content.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "content.tertiary",
      base: "grey.400",
      hex: SEMANTIC_LIGHT.content.tertiary,
      hue: "grey",
    },
    quaternary: {
      token: "content.quaternary",
      base: "grey.100",
      hex: SEMANTIC_LIGHT.content.quaternary,
      hue: "grey",
    },
    disabled: {
      token: "content.disabled",
      base: "grey.300",
      hex: SEMANTIC_LIGHT.content.disabled,
      hue: "grey",
    },
    invert: {
      token: "content.inverse",
      base: "grey.white",
      hex: SEMANTIC_LIGHT.content.inverse,
      hue: "grey",
    },
    brand1: {
      token: "content.brand1",
      base: "brand1.primary",
      hex: SEMANTIC_LIGHT.content.brand1,
      hue: "orange",
    },
    brand1Invert: {
      token: "content.brand1Inverse",
      base: "brand1.light1",
      hex: SEMANTIC_LIGHT.content.brand1Inverse,
      hue: "orange",
    },
    brand2: {
      token: "content.brand2",
      base: "brand1.dark3",
      hex: SEMANTIC_LIGHT.content.brand2,
      hue: "brown",
    },
    success: {
      token: "content.success",
      base: "green.500",
      hex: SEMANTIC_LIGHT.content.success,
      hue: "green",
    },
    warning: {
      token: "content.warning",
      base: "yellow.600",
      hex: SEMANTIC_LIGHT.content.warning,
      hue: "yellow",
    },
    error: {
      token: "content.error",
      base: "red.500",
      hex: SEMANTIC_LIGHT.content.error,
      hue: "red",
    },
    link: {
      token: "content.link",
      base: "blue.primary",
      hex: SEMANTIC_LIGHT.content.link,
      hue: "blue",
    },
  },

  border: {
    primary: {
      token: "border.primary",
      base: "grey.300",
      hex: SEMANTIC_LIGHT.border.primary,
      hue: "grey",
    },
    secondary: {
      token: "border.secondary",
      base: "grey.400",
      hex: SEMANTIC_LIGHT.border.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "border.tertiary",
      base: "grey.500",
      hex: SEMANTIC_LIGHT.border.tertiary,
      hue: "grey",
    },
    none: {
      token: "border.zero",
      base: "grey.100",
      hex: SEMANTIC_LIGHT.border.zero,
      hue: "grey",
    },
    brand: {
      token: "border.brand",
      base: "brand1.primary",
      hex: SEMANTIC_LIGHT.border.brand,
      hue: "orange",
    },
    brandInvert: {
      token: "border.brandInverse",
      base: "brand1.primary",
      hex: SEMANTIC_LIGHT.border.brandInverse,
      hue: "orange",
    },
    brand2: {
      token: "border.brand2",
      base: "brand2.light1",
      hex: SEMANTIC_LIGHT.border.brand2,
      hue: "brown",
    },
    success: {
      token: "border.success",
      base: "green.500",
      hex: SEMANTIC_LIGHT.border.success,
      hue: "green",
    },
    error: {
      token: "border.error",
      base: "red.500",
      hex: SEMANTIC_LIGHT.border.error,
      hue: "red",
    },
  },

  surface: {
    primary: {
      token: "surface.primary",
      base: "grey.white",
      hex: SEMANTIC_LIGHT.surface.primary,
      hue: "grey",
    },
    secondary: {
      token: "surface.secondary",
      base: "grey.50",
      hex: SEMANTIC_LIGHT.surface.secondary,
      hue: "grey",
    },
    tertiary: {
      token: "surface.tertiary",
      base: "grey.300",
      hex: SEMANTIC_LIGHT.surface.tertiary,
      hue: "grey",
    },
    invert: {
      token: "surface.inverse",
      base: "grey.950",
      hex: SEMANTIC_LIGHT.surface.inverse,
      hue: "grey",
    },
    disabled: {
      token: "surface.disabled",
      base: "grey.200",
      hex: SEMANTIC_LIGHT.surface.disabled,
      hue: "grey",
    },
    brand1: {
      token: "surface.brand1",
      base: "brand1.primary",
      hex: SEMANTIC_LIGHT.surface.brand1,
      hue: "orange",
    },
    brand1Accent: {
      token: "surface.brand1Accent",
      base: "brand1.light1",
      hex: SEMANTIC_LIGHT.surface.brand1Accent,
      hue: "orange",
    },
    brand2: {
      token: "surface.brand2",
      base: "brand2.primary",
      hex: SEMANTIC_LIGHT.surface.brand2,
      hue: "brown",
    },
    brand2Accent: {
      token: "surface.brand2Accent",
      base: "brand2.light1",
      hex: SEMANTIC_LIGHT.surface.brand2Accent,
      hue: "brown",
    },
    brand2Variant: {
      token: "surface.brand2Variant",
      base: "brand2.dark4",
      hex: PRIMITIVES.brand2.dark4,
      hue: "brown",
    },
    success: {
      token: "surface.success",
      base: "green.50",
      hex: SEMANTIC_LIGHT.surface.success,
      hue: "green",
    },
    warning: {
      token: "surface.warning",
      base: "yellow.20",
      hex: SEMANTIC_LIGHT.surface.warning,
      hue: "yellow",
    },
    error: {
      token: "surface.error",
      base: "red.50",
      hex: SEMANTIC_LIGHT.surface.error,
      hue: "red",
    },
  },
} as const;

export const PRIMITIVE_COLORS = {
  grey: { ...PRIMITIVES.grey },

  brand1: {
    primary: PRIMITIVES.brand1.primary,
    light1: PRIMITIVES.brand1.light1,
    light2: PRIMITIVES.brand1.light2,
    dark3: PRIMITIVES.brand1.dark3,
  },

  brand2: {
    primary: PRIMITIVES.brand2.primary,
    light1: PRIMITIVES.brand2.light1,
    light2: PRIMITIVES.brand2.light2,
    dark3: PRIMITIVES.brand2.dark3,
    dark4: PRIMITIVES.brand2.dark4,
    text: "#21190B",
    variant1: PRIMITIVES.brand2.primary,
    variant2: PRIMITIVES.brand2.dark4,
    accentGreen: PRIMITIVES.green[600],
  },

  yellow: { ...PRIMITIVES.yellow },
  green: {
    ...PRIMITIVES.green,
    accent: SEMANTIC_LIGHT.content.success,
    gradient: {
      light: PRIMITIVES.brand1.light2,
      medium: PRIMITIVES.brand2.light2,
      dark: PRIMITIVES.brand1.primary,
    },
  },
  red: {
    ...PRIMITIVES.red,
    warning: {
      background: "#FEEFEF",
      icon: "#D12C2C",
      text: "#7A2A2A",
    },
  },
  orange: { ...PRIMITIVES.orange },
  blue: { primary: PRIMITIVES.blue.primary },
} as const;

// Helper function to get hex value from color object
export const getHex = (color: { hex: string; hue: string }): string =>
  color.hex;

// Legacy compatibility - map to old structure for gradual migration
// This maintains backward compatibility with existing code
export const colors = {
  // Primary — Brand 1 (Mushroom orange)
  primary: {
    50: FIGMA_TOKENS.brand1.light1,
    100: FIGMA_TOKENS.brand1.light1,
    200: FIGMA_TOKENS.brand1.light2,
    300: FIGMA_TOKENS.brand2.light2,
    400: FIGMA_TOKENS.brand1.primary,
    500: PRIMITIVE_COLORS.brand1.primary,
    600: FIGMA_TOKENS.brand1.dark3,
    700: FIGMA_TOKENS.brand2.dark4,
    800: FIGMA_TOKENS.brand2.primary,
    900: FIGMA_TOKENS.brand2.text,
  },

  // Secondary — Brand 2 (Earth brown)
  secondary: {
    50: FIGMA_TOKENS.brand1.light1,
    100: FIGMA_TOKENS.brand2.light1,
    200: FIGMA_TOKENS.brand2.light2,
    300: FIGMA_TOKENS.brand1.primary,
    400: FIGMA_TOKENS.brand2.dark4,
    500: PRIMITIVE_COLORS.brand2.primary,
    600: PRIMITIVE_COLORS.brand2.dark3,
    700: FIGMA_TOKENS.brand2.text,
    800: FIGMA_TOKENS.brand2.text,
    900: FIGMA_TOKENS.brand2.text,
  },

  // Neutral colors - Grey
  neutral: {
    0: PRIMITIVE_COLORS.grey.white,
    50: PRIMITIVE_COLORS.grey[50],
    100: PRIMITIVE_COLORS.grey[100],
    200: PRIMITIVE_COLORS.grey[200],
    300: PRIMITIVE_COLORS.grey[300],
    400: PRIMITIVE_COLORS.grey[400],
    500: PRIMITIVE_COLORS.grey[500],
    600: PRIMITIVE_COLORS.grey[600],
    700: PRIMITIVE_COLORS.grey[700],
    800: PRIMITIVE_COLORS.grey[800],
    900: PRIMITIVE_COLORS.grey[900],
    950: PRIMITIVE_COLORS.grey[950],
  },

  // Semantic colors
  success: {
    50: LIGHT_COLORS.surface.success.hex,
    500: LIGHT_COLORS.text.success.hex,
    600: PRIMITIVE_COLORS.green[600],
    700: PRIMITIVE_COLORS.green[700],
  },

  warning: {
    50: LIGHT_COLORS.surface.warning.hex,
    500: LIGHT_COLORS.text.warning.hex,
    600: PRIMITIVE_COLORS.yellow[600],
    700: PRIMITIVE_COLORS.yellow[700],
  },

  error: {
    50: LIGHT_COLORS.surface.error.hex,
    500: LIGHT_COLORS.text.error.hex,
    600: PRIMITIVE_COLORS.red[600],
    700: PRIMITIVE_COLORS.red[700],
  },

  info: {
    50: "#eff6ff",
    500: LIGHT_COLORS.text.link.hex,
    600: "#2563eb",
    700: "#1d4ed8",
  },

  // Reminder colors - using brand colors where possible
  reminder: {
    watering: "#4098F9", // Keep as is (blue for water)
    misting: "#628CFF", // Keep as is (light blue)
    fertilising: PRIMITIVE_COLORS.orange[500], // Use orange
    rotating: PRIMITIVE_COLORS.brand1.light2,
  },
} as const;

export type ColorToken = typeof colors;

// Export COLORS for backward compatibility (used in some places)
export const COLORS = {
  primitives: {
    grey: {
      white: { hex: PRIMITIVE_COLORS.grey.white, hue: "grey" },
      50: { hex: PRIMITIVE_COLORS.grey[50], hue: "grey" },
      100: { hex: PRIMITIVE_COLORS.grey[100], hue: "grey" },
      200: { hex: PRIMITIVE_COLORS.grey[200], hue: "grey" },
      300: { hex: PRIMITIVE_COLORS.grey[300], hue: "grey" },
      400: { hex: PRIMITIVE_COLORS.grey[400], hue: "grey" },
      500: { hex: PRIMITIVE_COLORS.grey[500], hue: "grey" },
      600: { hex: PRIMITIVE_COLORS.grey[600], hue: "grey" },
      700: { hex: PRIMITIVE_COLORS.grey[700], hue: "grey" },
      800: { hex: PRIMITIVE_COLORS.grey[800], hue: "grey" },
      900: { hex: PRIMITIVE_COLORS.grey[900], hue: "grey" },
      950: { hex: PRIMITIVE_COLORS.grey[950], hue: "grey" },
    },
    brand1: {
      primary: { hex: PRIMITIVE_COLORS.brand1.primary, hue: "blue" },
      light1: { hex: PRIMITIVE_COLORS.brand1.light1, hue: "blue" },
      light2: { hex: PRIMITIVE_COLORS.brand1.light2, hue: "blue" },
      dark3: { hex: PRIMITIVE_COLORS.brand1.dark3, hue: "blue" },
    },
    brand2: {
      primary: { hex: PRIMITIVE_COLORS.brand2.primary, hue: "brown" },
      light1: { hex: PRIMITIVE_COLORS.brand2.light1, hue: "brown" },
      light2: { hex: PRIMITIVE_COLORS.brand2.light2, hue: "brown" },
      dark3: { hex: PRIMITIVE_COLORS.brand2.dark3, hue: "brown" },
      variant1: { hex: PRIMITIVE_COLORS.brand2.variant1, hue: "brown" },
      variant2: { hex: PRIMITIVE_COLORS.brand2.variant2, hue: "brown" },
    },
    yellow: Object.fromEntries(
      Object.entries(PRIMITIVE_COLORS.yellow).map(([key, value]) => [
        key,
        { hex: value, hue: "yellow" },
      ])
    ) as Record<
      keyof typeof PRIMITIVE_COLORS.yellow,
      { hex: string; hue: string }
    >,
    green: Object.fromEntries(
      Object.entries(PRIMITIVE_COLORS.green).map(([key, value]) => [
        key,
        { hex: value, hue: "green" },
      ])
    ) as Record<
      keyof typeof PRIMITIVE_COLORS.green,
      { hex: string; hue: string }
    >,
    red: Object.fromEntries(
      Object.entries(PRIMITIVE_COLORS.red).map(([key, value]) => [
        key,
        { hex: value, hue: "red" },
      ])
    ) as Record<
      keyof typeof PRIMITIVE_COLORS.red,
      { hex: string; hue: string }
    >,
    orange: Object.fromEntries(
      Object.entries(PRIMITIVE_COLORS.orange).map(([key, value]) => [
        key,
        { hex: value, hue: "orange" },
      ])
    ) as Record<
      keyof typeof PRIMITIVE_COLORS.orange,
      { hex: string; hue: string }
    >,
    blue: Object.fromEntries(
      Object.entries(PRIMITIVE_COLORS.blue).map(([key, value]) => [
        key,
        { hex: value, hue: "blue" },
      ])
    ) as Record<
      keyof typeof PRIMITIVE_COLORS.blue,
      { hex: string; hue: string }
    >,
  },
  tokens: {
    text: LIGHT_COLORS.text,
    border: LIGHT_COLORS.border,
    surface: LIGHT_COLORS.surface,
  },
} as const;
