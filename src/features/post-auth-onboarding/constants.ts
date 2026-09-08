import { SUBSCRIPTION_CTA_COLOR } from "../../constants/subscriptionColors";
import { FIGMA_TOKENS } from "../../design-system/colors/figmaTokens";
import { APP_COLORS } from "../../../theme/colors";

export type PostAuthOnboardingColors = {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textHighlight: string;
  textDisabled: string;
  ctaTextDark: string;
  discountRed: string;
  planBorderSelected: string;
  planBorderUnselected: string;
  planCardBackground: string;
  planCardBackgroundSelected: string;
  ctaGradient: readonly [string, string, string];
  ctaSolidBackground: string;
  useSolidCta: boolean;
  popularBadgeGradient: readonly [string, string, string];
  popularBadgeBg: string;
  popularBadgeText: string;
};

/** Figma 8327:72643 — selected plan teal ring, CTA/badge plum (#725481). */
const POST_AUTH_PAYWALL_CTA = APP_COLORS.ctaPrimary;
const POST_AUTH_PAYWALL_SELECTED_BORDER = "#41EDE9";

/** Light bird post-auth — black text, Figma subscription paywall */
export const POST_AUTH_ONBOARDING_COLORS_LIGHT: PostAuthOnboardingColors = {
  textPrimary: "#111111",
  textSecondary: "#5D5D5D",
  textTertiary: "#888888",
  textHighlight: "#111111",
  textDisabled: "#888888",
  ctaTextDark: "#FFFFFF",
  discountRed: "#EF4444",
  planBorderSelected: POST_AUTH_PAYWALL_SELECTED_BORDER,
  planBorderUnselected: "rgba(114, 84, 129, 0.12)",
  planCardBackground: "rgba(255, 255, 255, 0.15)",
  planCardBackgroundSelected: "rgba(255, 255, 255, 0.24)",
  ctaGradient: [
    POST_AUTH_PAYWALL_CTA,
    POST_AUTH_PAYWALL_CTA,
    POST_AUTH_PAYWALL_CTA,
  ],
  ctaSolidBackground: POST_AUTH_PAYWALL_CTA,
  useSolidCta: true,
  popularBadgeGradient: [
    POST_AUTH_PAYWALL_CTA,
    POST_AUTH_PAYWALL_CTA,
    POST_AUTH_PAYWALL_CTA,
  ],
  popularBadgeBg: POST_AUTH_PAYWALL_CTA,
  popularBadgeText: "#FFFFFF",
};

/** Dark onboarding — Figma 01 Colors - Mushroom App (node 11344:4197) */
export const POST_AUTH_ONBOARDING_COLORS_DARK: PostAuthOnboardingColors = {
  textPrimary: FIGMA_TOKENS.dark.text.primary,
  textSecondary: FIGMA_TOKENS.dark.text.secondary,
  textTertiary: FIGMA_TOKENS.dark.text.tertiary,
  textHighlight: FIGMA_TOKENS.dark.text.brand,
  textDisabled: FIGMA_TOKENS.dark.text.disabled,
  ctaTextDark: "#111111",
  discountRed: "#EF4444",
  planBorderSelected: POST_AUTH_PAYWALL_SELECTED_BORDER,
  planBorderUnselected: "rgba(114, 84, 129, 0.12)",
  planCardBackground: "rgba(255, 255, 255, 0.15)",
  planCardBackgroundSelected: "rgba(255, 255, 255, 0.24)",
  ctaGradient: ["#FFC27D", "#FFE5AA", "#FFBF76"],
  ctaSolidBackground: APP_COLORS.ctaPrimary,
  useSolidCta: true,
  popularBadgeGradient: [
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
  ],
  popularBadgeBg: SUBSCRIPTION_CTA_COLOR,
  popularBadgeText: "#FFFFFF",
};

/** @deprecated Prefer getPostAuthOnboardingColors(isDark) */
export const POST_AUTH_ONBOARDING_COLORS = POST_AUTH_ONBOARDING_COLORS_LIGHT;

export function getPostAuthOnboardingColors(
  isDark: boolean
): PostAuthOnboardingColors {
  return isDark
    ? POST_AUTH_ONBOARDING_COLORS_DARK
    : POST_AUTH_ONBOARDING_COLORS_LIGHT;
}

export const POST_AUTH_ONBOARDING_STEPS = {
  LOCATION: 0,
  NOTIFICATIONS: 1,
  SUBSCRIPTION: 2,
  SURPRISE: 3,
  DISCOUNT: 4,
} as const;

export const POST_AUTH_ONBOARDING_SLIDE_COUNT = 5;

export const POST_AUTH_LAYOUT = {
  horizontalPadding: 20,
  contentWidth: 335,
  ctaHeight: 44,
  ctaBorderRadius: 24,
  planGap: 8,
} as const;

/** Figma pack card border — linear-gradient(127deg, …), inner fill #FFF. */
export const POST_AUTH_PACK_BORDER_GRADIENT = {
  colors: ["#41EDE9", "#219699", "#0F7A81", "#9E70B6"] as const,
  locations: [0.0755, 0.1391, 0.1757, 0.9306] as const,
  angle: 127,
  borderWidth: 1.5,
  innerBackground: "#FFFFFF",
} as const;

/** Post-auth subscription slide discount countdown pill. */
export const POST_AUTH_DISCOUNT_TIMER_BG = "#01474F";
