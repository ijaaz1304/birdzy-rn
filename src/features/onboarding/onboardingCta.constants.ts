import { APP_COLORS } from "../../../theme/colors";

/** Primary onboarding CTA — dark mode */
export const ONBOARDING_CTA_DARK = {
  backgroundColor: APP_COLORS.ctaPrimary,
  borderRadius: 23.789,
} as const;

/** Figma 8041:11928 — Next button radius (same as dark). */
export const ONBOARDING_CTA_LIGHT_RADIUS = 23.789;

/** Figma 8041:11928 — phone onboarding Next button height (a minimum; grows with text) */
export const ONBOARDING_CTA_HEIGHT = 44;

/**
 * Space below the phone onboarding CTA. Safe-area rule: the CTA sits a constant
 * 12pt (Figma 8041:11927 gap) above the system inset — home indicator, gesture
 * area or 3-button bar — with a 24pt floor when the window reports no inset.
 */
export const getOnboardingCtaBottomPadding = (insetBottom: number) =>
  Math.max(insetBottom + 12, 24);
