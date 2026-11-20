import { APP_COLORS } from "../../../theme/colors";

/** Primary onboarding CTA — dark mode */
export const ONBOARDING_CTA_DARK = {
  backgroundColor: APP_COLORS.ctaPrimaryDark,
  borderRadius: 23.789,
} as const;

export const ONBOARDING_CTA_LIGHT_RADIUS = 24;

/** Phone onboarding CTA height (Button size="large" minHeight) */
export const ONBOARDING_CTA_HEIGHT = 48;

/**
 * Dark onboarding copy block (title + subtitle + dots) sits 64pt above the
 * Next button. Figma 9373:171154 / 9373:171207: copy `bottom: 152` =
 * 44 (below button) + 44 (button) + 64.
 */
export const ONBOARDING_TEXT_CTA_GAP_DARK = 64;

/** Space below the phone onboarding CTA (bottom safe area, min 24, + 8) */
export const getOnboardingCtaBottomPadding = (insetBottom: number) =>
  Math.max(insetBottom, 24) + 8;

/**
 * Dark Next button (Figma 9373:171344 / 9373:171343): 44pt tall, 10pt
 * vertical padding, and its bottom edge 44pt above the frame bottom
 * (12pt gap + 32pt home indicator bar). On a 34pt home-indicator inset that is
 * inset + 10; never less than Figma's 44pt.
 */
export const ONBOARDING_CTA_DARK_METRICS = {
  height: 44,
  paddingVertical: 10,
  minBottom: 44,
  aboveInset: 10,
} as const;

/**
 * Figma 9373:171344 Next button is a flat fill with no shadow. The shared dark
 * primary CTA style (getDarkPrimaryCtaStyle) adds an #FFAE00 glow + Android
 * elevation, which reads as a green haze under the teal button — cancel it.
 */
export const ONBOARDING_CTA_NO_SHADOW = {
  shadowColor: "transparent",
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
} as const;

/** Phone onboarding CTA height + bottom padding for the current theme */
export const getOnboardingCtaMetrics = (isDark: boolean, insetBottom: number) =>
  isDark
    ? {
        height: ONBOARDING_CTA_DARK_METRICS.height,
        bottomPadding: Math.max(
          insetBottom + ONBOARDING_CTA_DARK_METRICS.aboveInset,
          ONBOARDING_CTA_DARK_METRICS.minBottom
        ),
      }
    : {
        height: ONBOARDING_CTA_HEIGHT,
        bottomPadding: getOnboardingCtaBottomPadding(insetBottom),
      };

/**
 * Dark top navigation bar (Figma 9373:171353): 52pt bar right below the
 * status bar, 12pt side inset, Skip button hugs its label with 12pt padding.
 * Skip keeps a 40pt touch height, so the bar's top padding is (52 − 40) / 2.
 */
export const ONBOARDING_TOP_BAR_DARK = {
  paddingTop: 6,
  paddingHorizontal: 12,
} as const;
