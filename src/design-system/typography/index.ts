/**
 * Typography tokens for the design system
 * Based on Satoshi font family specifications
 */

import { TextStyle } from "react-native";
import { FONTS } from "../../common/typography";

export type FontWeight =
  | "normal"
  | "400"
  | "500"
  | "600"
  | "700"
  | "900"
  | "bold";

export interface TypographyStyle extends TextStyle {
  fontFamily?: string;
}

export const typography = {
  // Title styles (using Satoshi Black/Bold/Medium)
  title: {
    // 32px / Black (Satoshi Black)
    xlarge: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: FONTS.black as FontWeight,
    },
    // 28px / Bold (Satoshi Bold)
    large: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: FONTS.bold as FontWeight,
    },
    // 24px / Semibold (Satoshi Bold) - Using 600 for semibold
    medium: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: FONTS.bold as FontWeight,
    },
    // 20px / Semibold (Satoshi Bold) - Using 600 for semibold
    small: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: FONTS.bold as FontWeight,
    },
    // 18px / Medium (Satoshi Medium) - Default for headers
    xsmall: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONTS.medium as FontWeight,
    },
    // 18px / Bold (Satoshi Bold) - Title/18px/Bold, line-height 24px (133.333%)
    xsmallBold: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONTS.bold as FontWeight,
    },
  },

  // Body styles (using Satoshi Regular/Bold/Medium) – 02 Typography spec line heights
  body: {
    // 16px / Regular (Satoshi Regular) – Body/16px/Regular, line height 24px, letter-spacing -0.16px
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: FONTS.regular as FontWeight,
      letterSpacing: -0.16,
    },
    // 16px / SemiBold (Satoshi Bold) – line height 24px
    largeSemibold: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: FONTS.bold as FontWeight,
    },
    // 16px / Medium (Satoshi Medium) – line height 24px
    largeMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: FONTS.medium as FontWeight,
    },
    // 14px / Regular (Satoshi Regular) – line height 20px
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.regular as FontWeight,
    },
    // 14px / SemiBold (Satoshi Bold) – line height 20px
    mediumSemibold: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.bold as FontWeight,
    },
    // 14px / Medium (Satoshi Medium) – line height 20px
    mediumMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.medium as FontWeight,
    },
    // 12px / Regular (Satoshi Regular) – caption size, line height 16px
    small: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: FONTS.regular as FontWeight,
    },
  },

  // Button styles (using Satoshi Medium) – 02 Typography spec
  button: {
    // 16px (Satoshi Medium) – line height 24px
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: FONTS.medium as FontWeight,
    },
    // 14px (Satoshi Medium) – line height 20px
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.medium as FontWeight,
    },
  },

  // Caption styles (using Satoshi Regular/Medium) – 02 Typography spec line height 16px
  caption: {
    // 12px / Regular (Satoshi Regular)
    regular: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: FONTS.regular as FontWeight,
    },
    // 12px / Medium (Satoshi Medium)
    medium: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: FONTS.medium as FontWeight,
    },
    // 12px / Strikethrough (Satoshi Regular)
    strikethrough: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: FONTS.regular as FontWeight,
      textDecorationLine: "line-through",
    },
  },

  // Legacy compatibility - Display styles (mapped to Title)
  display: {
    large: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: FONTS.black as FontWeight,
    },
    medium: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: FONTS.bold as FontWeight,
    },
    small: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: FONTS.bold as FontWeight,
    },
  },

  // Legacy compatibility - Headline styles (mapped to Title)
  headline: {
    large: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: FONTS.bold as FontWeight,
    },
    medium: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONTS.medium as FontWeight,
    },
    small: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONTS.medium as FontWeight,
    },
  },

  // Legacy compatibility - Title styles (kept for backward compatibility)
  // Note: These are now mapped to the new title structure above

  // Legacy compatibility - Label styles (mapped to Button/Caption)
  label: {
    large: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.medium as FontWeight,
    },
    medium: {
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONTS.medium as FontWeight,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontFamily: FONTS.medium as FontWeight,
    },
  },
} as const;

export type TypographyToken = typeof typography;
