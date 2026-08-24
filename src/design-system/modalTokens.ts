/**
 * Centralized modal/sheet tokens.
 * Use with theme for colors; radius/spacing from theme.radius, theme.spacing.
 */

import type { ViewStyle } from "react-native";
import type { Theme } from "./themes";
import { FIGMA_TOKENS } from "./colors/figmaTokens";
import { APP_COLORS } from "../config/colors";

export const MODAL = {
  /** Centered card max width */
  maxWidth: 400,
  /** Popup / bottom-sheet corner radius (Figma: radius-l-pop-up-bottom-sheet) */
  cardRadius: FIGMA_TOKENS.radius.popup,
  /** Primary CTA height */
  buttonHeight: 50,
  /** Close button min tappable size */
  closeMinSize: 44,
  /** Animation duration open (ms) */
  openDuration: 280,
  /** Animation duration close (ms) */
  closeDuration: 220,
} as const;

/** Figma popup radius — 16px */
export const POPUP_BORDER_RADIUS = MODAL.cardRadius;

/** Figma secondary popup CTA radius — Radius-xl / 24px */
export const POPUP_SECONDARY_CTA_RADIUS = 24;

/** Secondary popup CTA: 24px radius, surface primary fill, border-0 stroke */
export function getPopupSecondaryCtaStyle(theme: Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfacePrimary,
    borderWidth: 1,
    borderColor: theme.colors.border0,
    borderRadius: POPUP_SECONDARY_CTA_RADIUS,
  };
}

export function getPopupSecondaryCtaTextColor(theme: Theme): string {
  return theme.mode === "dark" ? theme.colors.textPrimary : theme.colors.text;
}

/** Dark popup outline — Figma Border-0 / #333333 */
export function getDarkPopupBorderStyle(theme: Theme): ViewStyle {
  if (theme.mode !== "dark") return {};
  return {
    borderWidth: 1,
    borderColor: APP_COLORS.borderDark,
  };
}

/** Dark popup surface: #111 bg, #333 border, 16px radius */
export function getPopupChromeStyle(theme: Theme): ViewStyle {
  const isDark = theme.mode === "dark";
  return {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: isDark ? POPUP_BORDER_RADIUS : theme.radius.xl,
    ...getDarkPopupBorderStyle(theme),
  };
}

/** Bottom sheet top chrome — 16px radius + border in dark mode */
export function getBottomSheetChromeStyle(theme: Theme): ViewStyle {
  const isDark = theme.mode === "dark";
  const topRadius = isDark ? POPUP_BORDER_RADIUS : theme.radius["2xl"];
  return {
    borderTopLeftRadius: topRadius,
    borderTopRightRadius: topRadius,
    ...(isDark
      ? {
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: APP_COLORS.borderDark,
        }
      : {}),
  };
}
