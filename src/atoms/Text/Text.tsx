/**
 * Text atom component
 *
 * Ensures safe lineHeight to prevent vertical clipping, especially for large/bold text.
 * Handles fontWeight safely with optional fontFamilies mapping support.
 */

import React from "react";
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface TextProps extends RNTextProps {
  variant?: "display" | "headline" | "title" | "body" | "label" | "caption";
  size?: "large" | "medium" | "small";
  color?:
    | "text"
    | "textPrimary"
    | "onPrimary"
    | "surface"
    | "textSecondary"
    | "textTertiary"
    | "primary"
    | "error"
    | "success"
    | "textInverse";
  weight?: "normal" | "regular" | "medium" | "semibold" | "bold" | "black";
}

/**
 * Calculate safe lineHeight to prevent vertical clipping
 * For larger fonts (>28px) and bold weights, uses more generous spacing
 * Uses fontSize * 1.5 for fonts <=28px, fontSize * 1.6 for larger fonts
 * Bold weights get additional 3px padding
 * Updated ratios to accommodate new font with better vertical spacing
 */
const getSafeLineHeight = (
  fontSize: number,
  existingLineHeight?: number,
  isBold?: boolean
): number => {
  // For larger fonts, always recalculate to ensure safe spacing
  // If existing lineHeight is too small relative to fontSize, recalculate
  // Increased ratios for better text display with new font
  const minLineHeightRatio = fontSize > 28 ? 1.6 : 1.5;
  const minLineHeight = Math.round(fontSize * minLineHeightRatio);

  // Add extra padding for bold fonts (increased from 2px to 3px)
  const boldPadding = isBold ? 3 : 0;

  // Use existing lineHeight only if it's sufficient, otherwise recalculate
  if (existingLineHeight !== undefined && existingLineHeight >= minLineHeight) {
    return existingLineHeight + boldPadding;
  }

  return minLineHeight + boldPadding;
};

/**
 * Map weight prop to fontWeight value
 */
const mapWeightToFontWeight = (
  weight?: "normal" | "regular" | "medium" | "semibold" | "bold" | "black"
): TextStyle["fontWeight"] => {
  switch (weight) {
    case "normal":
    case "regular":
      return "400";
    case "medium":
      return "500";
    case "semibold":
      return "600";
    case "bold":
      return "700";
    case "black":
      return "900";
    default:
      return undefined;
  }
};

/**
 * Get fontFamily from theme.fontFamilies if available, otherwise return undefined
 */
const getFontFamily = (
  weight: "normal" | "regular" | "medium" | "semibold" | "bold" | "black" | undefined,
  fontFamilies?: {
    normal?: string;
    medium?: string;
    semibold?: string;
    bold?: string;
    black?: string;
  }
): string | undefined => {
  if (!weight || !fontFamilies) {
    return undefined;
  }

  const key =
    weight === "regular" ? "normal" : weight;

  return fontFamilies[key as keyof typeof fontFamilies];
};

export const Text: React.FC<TextProps> = ({
  variant = "body",
  size = "medium",
  color = "text",
  weight,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  // Safely access typography style with fallback
  const variantStyles = theme.typography[variant];
  const typographyStyle =
    variantStyles && size in variantStyles
      ? variantStyles[size as keyof typeof variantStyles]
      : undefined;
  if (!typographyStyle) {
    console.warn(
      `Typography style not found: variant="${variant}", size="${size}". Using fallback.`
    );
  }
  // Extract fontSize from style override if present, otherwise use typography fontSize
  const styleObj = StyleSheet.flatten(style) as TextStyle | null;
  const themeColor = theme.colors[color as keyof typeof theme.colors];
  const defaultTextColor =
    typeof themeColor === "string" ? themeColor : color;
  const textColor = styleObj?.color ?? defaultTextColor;
  const actualFontSize = styleObj?.fontSize || typographyStyle?.fontSize || 14;

  // Check if text is bold (weight is bold or fontWeight is 700/bold)
  const isBold =
    weight === "bold" ||
    styleObj?.fontWeight === "700" ||
    styleObj?.fontWeight === "bold";

  // Ensure safe lineHeight to prevent vertical clipping
  // Always recalculate based on actual fontSize being used
  const safeLineHeight = getSafeLineHeight(
    actualFontSize,
    typographyStyle?.lineHeight,
    isBold
  );

  // Handle fontWeight safely: prefer fontFamily if available, fallback to fontWeight
  const fontFamily = getFontFamily(weight, theme.fontFamilies);
  const fontWeight = fontFamily ? undefined : mapWeightToFontWeight(weight);

  const textStyle = [
    typographyStyle || {}, // Use empty object as fallback if typographyStyle is undefined
    {
      color: textColor,
      lineHeight: safeLineHeight, // Always ensure safe lineHeight based on actual fontSize
    },
    // Only apply fontFamily if available (custom fonts), otherwise use fontWeight
    fontFamily && { fontFamily },
    !fontFamily && fontWeight && { fontWeight },
    style,
  ];

  return (
    <RNText style={StyleSheet.flatten(textStyle)} {...props}>
      {children}
    </RNText>
  );
};
