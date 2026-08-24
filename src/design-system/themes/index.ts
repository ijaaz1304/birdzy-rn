/**
 * Theme system with light and dark mode support
 */

import { typography } from "../typography";
import { spacing } from "../spacing";
import { radius } from "../radius";
import { shadows } from "../shadows";
import { DARK_COLORS, LIGHT_COLORS, PRIMITIVE_COLORS } from "../colors";
import { FIGMA_TOKENS } from "../colors/figmaTokens";
import {
  SEMANTIC_DARK,
  SEMANTIC_LIGHT,
} from "../colors/semantic";

import { SCREEN_COLORS } from "../../constants/colorConstants";

import { APP_COLORS } from "../../../theme/colors";

export type ThemeMode = "light" | "dark" | "system";

export interface Theme {
  mode: "light" | "dark";
  colors: {
    // Background colors
    background: string;
    surface: string;
    surfaceVariant: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;

    // Border colors
    border: string;
    borderLight: string;

    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    onPrimary: string;

    // Secondary colors
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    onSecondary: string;

    // Semantic colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Overlay (modal backdrop: light 0.35–0.45, dark 0.65–0.75)
    overlay: string;

    // Modal / popup card surface (elevated; dark = #111111)
    cardBackground: string;

    // Plant-specific colors
    plantGreen: string;
    plantBrown: string;

    // Legacy color names for backward compatibility
    textPrimary: string;
    textBrand: string;
    textSuccess: string;
    textError: string;
    border0: string;
    borderPrimary: string;
    borderSecondary: string;
    borderTertiary: string;
    borderBrand: string;
    borderBrandInvert: string;
    borderError: string;
    borderSuccess: string;
    surfacePrimary: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
    surfaceInvert: string;
    surfaceBrand: string;
    surfaceBrandGreen: string;
    surfaceBrand2: string;
    surfaceBrand2Accent: string;
    surfaceBrand2Light: string;
    surfaceBrand2Variant: string;
    surfaceAccentBrown: string;
    surfaceAccentGreen: string;
    surfaceSuccess: string;
    surfaceError: string;
    overlayDark: string;

    // Reminder card colors
    reminderCardBackground: string;
    reminderActionButtonBackground: string;

    // Reminder type colors
    reminderWatering: string;
    reminderMisting: string;
    reminderFertilising: string;
    reminderRotating: string;

    // Design spec: onboarding, auth, chips, tabs (single source – no hardcoded hex in screens)
    primaryCTA: string;
    dotSelected: string;
    dotUnselected: string;
    resendTimer: string;
    linkBlue: string;
    chipSelectedBg: string;
    chipSelectedText: string;
    chipUnselectedBg: string;
    chipUnselectedBorder: string;
    chipUnselectedText: string;
    loginButton: string;
    tabActiveColor: string;
    tabInactiveColor: string;
    skipButtonBorder: string;
    skipButtonBg: string;
    inputPlaceholder: string;
    brandAccent: string;
    brandEarth: string;
    /** Semantic tokens — prefer these in new UI */
    content: Record<keyof typeof SEMANTIC_LIGHT.content, string>;
    borderSemantic: Record<keyof typeof SEMANTIC_LIGHT.border, string>;
    surfaceSemantic: Record<keyof typeof SEMANTIC_LIGHT.surface, string>;
    /** @deprecated Use brandAccent */
    rockBlue: string;
    /** @deprecated Use brandEarth */
    rockBrown: string;

    /** Text field / text area surface (dark popup forms: #171717) */
    textFieldBackground: string;
    /** Text field default border (dark: #333) */
    textFieldBorder: string;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  /** Corner radius for text inputs (dark: 12px card/text-area) */
  textFieldBorderRadius: number;
  // Optional fontFamilies mapping for custom font support
  // If provided, Text component will use fontFamily instead of fontWeight
  fontFamilies?: {
    normal?: string;
    medium?: string;
    semibold?: string;
    bold?: string;
    black?: string;
  };
}

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    background: APP_COLORS.surfaceAuthLight,
    surface: APP_COLORS.modalTextOnPrimary,
    surfaceVariant: PRIMITIVE_COLORS.grey[50],

    text: LIGHT_COLORS.text.primary.hex, // #111111 - Primary text
    textSecondary: LIGHT_COLORS.text.secondary.hex, // #5D5D5D - Secondary/sub text
    textTertiary: LIGHT_COLORS.text.tertiary.hex,
    textInverse: LIGHT_COLORS.text.invert.hex,

    border: SCREEN_COLORS.LIGHT.border,
    borderLight: PRIMITIVE_COLORS.grey[100],

    primary: APP_COLORS.brandPrimaryDark,
    primaryLight: PRIMITIVE_COLORS.brand1.light2,
    primaryDark: PRIMITIVE_COLORS.brand1.dark3,
    onPrimary: APP_COLORS.modalTextOnPrimary,

    secondary: PRIMITIVE_COLORS.brand2.dark3,
    secondaryLight: PRIMITIVE_COLORS.brand2.light2,
    secondaryDark: PRIMITIVE_COLORS.brand2.dark3,
    onSecondary: PRIMITIVE_COLORS.grey.white,

    success: LIGHT_COLORS.text.success.hex,
    warning: LIGHT_COLORS.text.warning.hex,
    error: LIGHT_COLORS.text.error.hex,
    info: LIGHT_COLORS.text.link.hex,

    overlay: "rgba(0, 0, 0, 0.4)",
    cardBackground: LIGHT_COLORS.surface.primary.hex,

    plantGreen: PRIMITIVE_COLORS.brand1.primary, // Keep for backward compatibility
    plantBrown: PRIMITIVE_COLORS.brand2.dark3, // Keep for backward compatibility
    brandAccent: PRIMITIVE_COLORS.brand1.primary,
    brandEarth: PRIMITIVE_COLORS.brand2.primary,
    rockBlue: PRIMITIVE_COLORS.brand1.primary,
    rockBrown: PRIMITIVE_COLORS.brand2.primary,

    // Legacy color mappings - using new color tokens
    textPrimary: LIGHT_COLORS.text.primary.hex, // #111111 - Primary text
    textBrand: LIGHT_COLORS.text.brand1.hex, // #46804F
    textSuccess: LIGHT_COLORS.text.success.hex,
    textError: LIGHT_COLORS.text.error.hex,
    border0: LIGHT_COLORS.border.none.hex,
    borderPrimary: LIGHT_COLORS.border.primary.hex,
    borderSecondary: LIGHT_COLORS.border.secondary.hex,
    borderTertiary: LIGHT_COLORS.border.tertiary.hex,
    borderBrand: LIGHT_COLORS.border.brand.hex,
    borderBrandInvert: LIGHT_COLORS.border.brandInvert.hex,
    borderError: LIGHT_COLORS.border.error.hex,
    borderSuccess: LIGHT_COLORS.border.success.hex,
    surfacePrimary: LIGHT_COLORS.surface.primary.hex, // #FFFFFF - Cards, modals, and surfaces
    surfaceSecondary: LIGHT_COLORS.surface.secondary.hex, // #F6F6F6 - Overall background
    surfaceTertiary: LIGHT_COLORS.surface.tertiary.hex,
    surfaceInvert: LIGHT_COLORS.surface.invert.hex,
    surfaceBrand: LIGHT_COLORS.surface.brand1.hex,
    surfaceBrandGreen: PRIMITIVE_COLORS.brand1.light2,
    surfaceBrand2: LIGHT_COLORS.surface.brand2.hex,
    surfaceBrand2Accent: LIGHT_COLORS.surface.brand2Accent.hex,
    surfaceBrand2Variant:
      LIGHT_COLORS.surface.brand2Variant?.hex ||
      PRIMITIVE_COLORS.brand2.variant1,
    surfaceBrand2Light: PRIMITIVE_COLORS.brand2.light2,
    surfaceAccentBrown: PRIMITIVE_COLORS.orange[200],
    surfaceAccentGreen: PRIMITIVE_COLORS.green[200],
    surfaceSuccess: LIGHT_COLORS.surface.success.hex,
    surfaceError: LIGHT_COLORS.surface.error.hex,
    overlayDark: "rgba(0, 0, 0, 0.5)",
    reminderCardBackground: PRIMITIVE_COLORS.green[100],
    reminderActionButtonBackground: PRIMITIVE_COLORS.green[100],
    reminderWatering: "#4098F9",
    reminderMisting: "#628CFF",
    reminderFertilising: PRIMITIVE_COLORS.orange[500],
    reminderRotating: PRIMITIVE_COLORS.brand1.light2,

    primaryCTA: APP_COLORS.ctaPrimary,
    dotSelected: APP_COLORS.paginationDotSelectedLight,
    dotUnselected: APP_COLORS.paginationDotUnselectedLight,
    resendTimer: "#888888",
    linkBlue: LIGHT_COLORS.text.link.hex, // #007AFF - Design token Text & icon-Link
    chipSelectedBg: APP_COLORS.promoCardAskGradientStart,
    chipSelectedText: "#111111",
    chipUnselectedBg: APP_COLORS.modalTextOnPrimary,
    chipUnselectedBorder: SCREEN_COLORS.LIGHT.border,
    chipUnselectedText: PRIMITIVE_COLORS.brand2.text,
    loginButton: PRIMITIVE_COLORS.grey[800],
    tabActiveColor: LIGHT_COLORS.text.primary.hex,
    tabInactiveColor: PRIMITIVE_COLORS.grey[400],
    skipButtonBorder: SCREEN_COLORS.LIGHT.border,
    skipButtonBg: APP_COLORS.modalTextOnPrimary,
    inputPlaceholder: PRIMITIVE_COLORS.grey[400],
    content: SEMANTIC_LIGHT.content,
    borderSemantic: SEMANTIC_LIGHT.border,
    surfaceSemantic: SEMANTIC_LIGHT.surface,
    textFieldBackground: LIGHT_COLORS.surface.primary.hex,
    textFieldBorder: LIGHT_COLORS.border.none.hex,
  },
  typography,
  spacing,
  radius,
  shadows,
  textFieldBorderRadius: radius.textfield,
  fontFamilies: {
    normal: "Satoshi-Regular",
    medium: "Satoshi-Medium",
    semibold: "Satoshi-Bold",
    bold: "Satoshi-Bold",
    black: "Satoshi-Black",
  },
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    background: DARK_COLORS.surface.secondary.hex,
    surface: DARK_COLORS.surface.secondary.hex,
    surfaceVariant: DARK_COLORS.surface.tertiary.hex,

    text: DARK_COLORS.text.primary.hex,
    textSecondary: DARK_COLORS.text.secondary.hex,
    textTertiary: DARK_COLORS.text.tertiary.hex,
    textInverse: DARK_COLORS.text.invert.hex,

    border: DARK_COLORS.border.primary.hex,
    borderLight: DARK_COLORS.border.secondary.hex,

    primary: DARK_COLORS.surface.brand1.hex,
    primaryLight: FIGMA_TOKENS.brand1.light2,
    primaryDark: FIGMA_TOKENS.brand1.primary,
    onPrimary: DARK_COLORS.text.invert.hex,

    secondary: DARK_COLORS.text.brand2.hex,
    secondaryLight: DARK_COLORS.surface.brand2.hex,
    secondaryDark: DARK_COLORS.surface.brand2Accent.hex,
    onSecondary: DARK_COLORS.text.primary.hex,

    success: DARK_COLORS.text.success.hex,
    warning: DARK_COLORS.text.warning.hex,
    error: APP_COLORS.error, // Star icon color (uncheck and check filled)
    info: DARK_COLORS.text.link.hex,

    overlay: "rgba(0, 0, 0, 0.7)",
    cardBackground: DARK_COLORS.surface.primary.hex,

    plantGreen: DARK_COLORS.text.brand1.hex,
    plantBrown: DARK_COLORS.text.brand2.hex,
    brandAccent: DARK_COLORS.text.brand1.hex,
    brandEarth: DARK_COLORS.text.brand2.hex,
    rockBlue: DARK_COLORS.text.brand1.hex,
    rockBrown: DARK_COLORS.text.brand2.hex,

    // Legacy color mappings - using new color tokens
    textPrimary: DARK_COLORS.text.primary.hex, // #FFFFFF - Primary text
    textBrand: DARK_COLORS.text.brand1.hex,
    textSuccess: DARK_COLORS.text.success.hex,
    textError: APP_COLORS.error, // Star icon color
    border0: DARK_COLORS.border.none.hex,
    borderPrimary: DARK_COLORS.border.primary.hex,
    borderSecondary: DARK_COLORS.border.secondary.hex,
    borderTertiary: DARK_COLORS.border.tertiary.hex,
    borderBrand: DARK_COLORS.border.brand.hex,
    borderBrandInvert: DARK_COLORS.border.brandInvert.hex,
    borderError: DARK_COLORS.border.error.hex,
    borderSuccess: DARK_COLORS.border.success.hex,
    surfacePrimary: DARK_COLORS.surface.primary.hex,
    surfaceSecondary: DARK_COLORS.surface.secondary.hex,
    surfaceTertiary: DARK_COLORS.surface.tertiary.hex,
    surfaceInvert: DARK_COLORS.surface.invert.hex,
    surfaceBrand: DARK_COLORS.surface.brand1.hex,
    surfaceBrandGreen: DARK_COLORS.surface.brand1Accent.hex,
    surfaceBrand2: DARK_COLORS.surface.brand2.hex,
    surfaceBrand2Accent: DARK_COLORS.surface.brand2Accent.hex,
    surfaceBrand2Variant: PRIMITIVE_COLORS.brand2.variant2,
    surfaceBrand2Light: DARK_COLORS.surface.brand2Accent.hex,
    surfaceAccentBrown: DARK_COLORS.surface.warning.hex,
    surfaceAccentGreen: DARK_COLORS.surface.brand1Accent.hex,
    surfaceSuccess: DARK_COLORS.surface.success.hex,
    surfaceError: DARK_COLORS.surface.error.hex,
    overlayDark: "rgba(0, 0, 0, 0.5)",
    reminderCardBackground: DARK_COLORS.surface.brand1Accent.hex,
    reminderActionButtonBackground: DARK_COLORS.surface.brand1Accent.hex,
    reminderWatering: "#4098F9",
    reminderMisting: "#628CFF",
    reminderFertilising: PRIMITIVE_COLORS.orange[500],
    reminderRotating: PRIMITIVE_COLORS.brand1.light2,

    primaryCTA: APP_COLORS.ctaPrimary,
    dotSelected: DARK_COLORS.surface.brand1.hex,
    dotUnselected: "rgba(247, 178, 58, 0.2)",
    resendTimer: DARK_COLORS.text.tertiary.hex,
    linkBlue: DARK_COLORS.text.link.hex,
    chipSelectedBg: DARK_COLORS.surface.brand1.hex,
    chipSelectedText: DARK_COLORS.text.invert.hex,
    chipUnselectedBg: DARK_COLORS.surface.secondary.hex,
    chipUnselectedBorder: DARK_COLORS.border.primary.hex,
    chipUnselectedText: DARK_COLORS.text.brand1.hex,
    loginButton: DARK_COLORS.border.primary.hex,
    tabActiveColor: DARK_COLORS.text.primary.hex,
    tabInactiveColor: DARK_COLORS.text.tertiary.hex,
    skipButtonBorder: DARK_COLORS.border.primary.hex,
    skipButtonBg: DARK_COLORS.surface.primary.hex,
    inputPlaceholder: DARK_COLORS.text.tertiary.hex,
    content: SEMANTIC_DARK.content,
    borderSemantic: SEMANTIC_DARK.border,
    surfaceSemantic: SEMANTIC_DARK.surface,
    textFieldBackground: DARK_COLORS.surface.secondary.hex,
    textFieldBorder: DARK_COLORS.border.primary.hex,
  },
  typography,
  spacing,
  radius,
  shadows,
  textFieldBorderRadius: radius.textfield,
  fontFamilies: {
    normal: "Satoshi-Regular",
    medium: "Satoshi-Medium",
    semibold: "Satoshi-Bold",
    bold: "Satoshi-Bold",
    black: "Satoshi-Black",
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;
