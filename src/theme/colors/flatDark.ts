import { darkColors } from "./dark";

/** Flat dark palette for runtime theme / direct component use */
export const flatDarkColors = {
  // Content (text + icons)
  contentPrimary: darkColors.content.primary,
  contentSecondary: darkColors.content.secondary,
  contentTertiary: darkColors.content.tertiary,
  contentQuaternary: darkColors.content.quaternary,

  // Text (legacy aliases)
  textPrimary: darkColors.text.primary,
  textSecondary: darkColors.text.secondary,
  textTertiary: darkColors.text.tertiary,
  textQuaternary: darkColors.text.quaternary,

  textBrand: darkColors.text.brand,
  textBrandInvert: darkColors.text.brandInvert,

  textSuccess: darkColors.text.success,
  textWarning: darkColors.text.warning,
  textError: darkColors.text.error,

  textDisabled: darkColors.text.disabled,
  textLink: darkColors.text.link,
  textInvert: darkColors.text.invert,

  // Border
  borderPrimary: darkColors.border.primary,
  borderSecondary: darkColors.border.secondary,
  borderTertiary: darkColors.border.tertiary,

  borderBrand: darkColors.border.brand,
  borderBrandInvert: darkColors.border.brandInvert,
  borderBrand2: darkColors.border.brand2,

  borderSuccess: darkColors.border.success,
  borderError: darkColors.border.error,

  // Surface
  surfacePrimary: darkColors.surface.primary,
  surfaceSecondary: darkColors.surface.secondary,
  surfaceTertiary: darkColors.surface.tertiary,

  surfaceInvert: darkColors.surface.invert,

  surfaceBrand: darkColors.surface.brand,
  surfaceBrandAccent: darkColors.surface.brandAccent,

  surfaceBrand2: darkColors.surface.brand2,
  surfaceBrand2Accent: darkColors.surface.brand2Accent,

  surfaceSuccess: darkColors.surface.success,
  surfaceWarning: darkColors.surface.warning,
  surfaceError: darkColors.surface.error,

  surfaceDisabled: darkColors.surface.disabled,

  /** Primary button / CTA fill in dark mode (Surface-brand-1) */
  primaryCTA: darkColors.text.primaryCTA,
} as const;

export type FlatDarkColors = typeof flatDarkColors;
