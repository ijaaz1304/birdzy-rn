/**
 * Legacy design system compatibility layer
 * Re-exports from design-system for backward compatibility
 *
 * @deprecated Use design-system instead
 */

export { useTheme } from "../hooks/useTheme";

import { spacing } from "../design-system/spacing";
export const Spacing = {
  0: spacing[0],
  1: spacing[1],
  2: spacing[2],
  3: spacing[3],
  4: spacing[4],
  5: spacing[5],
  6: spacing[6],
  7: spacing[7],
  8: spacing[8],
  9: spacing[9],
  10: spacing[10],
};

export const Space = {
  none: spacing[0],
  xs: spacing[1],
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
  xxl: spacing[10],
};

import { radius } from "../design-system/radius";
export const Radius = {
  card: radius.md,
  button: radius.full,
  textfield: radius.full,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  "2xl": radius["2xl"],
  full: radius.full,
};

import { typography } from "../design-system/typography";
export const Typography = {
  family: {
    regular: "Satoshi-Regular",
    medium: "Satoshi-Medium",
    bold: "Satoshi-Bold",
    black: "Satoshi-Black",
  },
  size: {
    title28: typography.display.medium.fontSize,
    title24: typography.headline.medium.fontSize,
    title18: typography.title.large.fontSize,
    body16: typography.body.large.fontSize,
    body14: typography.body.medium.fontSize,
    button16: typography.label.large.fontSize,
    button14: typography.label.medium.fontSize,
    caption12: typography.body.small.fontSize,
  },
  lineHeight: {
    title28: typography.display.medium.lineHeight,
    title24: typography.headline.medium.lineHeight,
    title18: typography.title.large.lineHeight,
    body16: typography.body.large.lineHeight,
    body14: typography.body.medium.lineHeight,
    button16: typography.label.large.lineHeight,
    button14: typography.label.medium.lineHeight,
    caption12: typography.body.small.lineHeight,
  },
  presets: {
    title28: typography.display.medium,
    title24: typography.headline.large,
    title20: typography.headline.large,
    title18: typography.title.xsmall,
    body16: typography.body.large,
    body14: typography.body.medium,
    button16: typography.label.large,
    button14: typography.label.medium,
    caption12: typography.body.small,
  },
};

import { themes } from "../design-system/themes";
export const Theme = {
  Typography,
  light: themes.light,
  dark: themes.dark,
};
