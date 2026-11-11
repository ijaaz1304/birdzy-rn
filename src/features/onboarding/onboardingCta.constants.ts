import { APP_COLORS } from "../../../theme/colors";

/** Primary onboarding CTA — dark mode */
export const ONBOARDING_CTA_DARK = {
  backgroundColor: APP_COLORS.ctaPrimary,
  borderRadius: 23.789,
} as const;

export const ONBOARDING_CTA_LIGHT_RADIUS = 24;

/** Phone onboarding CTA height (Button size="large" minHeight) */
export const ONBOARDING_CTA_HEIGHT = 48;

/** Space below the phone onboarding CTA (bottom safe area, min 24, + 8) */
export const getOnboardingCtaBottomPadding = (insetBottom: number) =>
  Math.max(insetBottom, 24) + 8;
