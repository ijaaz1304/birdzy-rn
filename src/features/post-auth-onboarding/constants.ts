import { SUBSCRIPTION_CTA_COLOR } from "../../constants/subscriptionColors";
import { FIGMA_TOKENS } from "../../design-system/colors/figmaTokens";
import { DARK_SURFACE_BRAND_1 } from "../../theme/colors/dark";

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

/** Light mushroom post-auth — black text, brand CTA (Figma 8380+, 8253+, 8289+) */
export const POST_AUTH_ONBOARDING_COLORS_LIGHT: PostAuthOnboardingColors = {
  textPrimary: "#111111",
  textSecondary: "#5D5D5D",
  textTertiary: "#888888",
  textHighlight: "#111111",
  textDisabled: "#888888",
  ctaTextDark: "#FFFFFF",
  discountRed: "#EF4444",
  planBorderSelected: SUBSCRIPTION_CTA_COLOR,
  planBorderUnselected: "rgba(114, 84, 129, 0.12)",
  planCardBackground: "rgba(255, 255, 255, 0.15)",
  planCardBackgroundSelected: "rgba(255, 255, 255, 0.24)",
  ctaGradient: [
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
  ],
  ctaSolidBackground: SUBSCRIPTION_CTA_COLOR,
  useSolidCta: true,
  popularBadgeGradient: [
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
    SUBSCRIPTION_CTA_COLOR,
  ],
  popularBadgeBg: SUBSCRIPTION_CTA_COLOR,
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
  planBorderSelected: SUBSCRIPTION_CTA_COLOR,
  planBorderUnselected: "rgba(114, 84, 129, 0.12)",
  planCardBackground: "rgba(255, 255, 255, 0.15)",
  planCardBackgroundSelected: "rgba(255, 255, 255, 0.24)",
  ctaGradient: ["#FFC27D", "#FFE5AA", "#FFBF76"],
  ctaSolidBackground: DARK_SURFACE_BRAND_1,
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
  planGap: 8,
} as const;
