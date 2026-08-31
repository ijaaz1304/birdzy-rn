/**
 * Color Constants
 * Centralized color values to avoid hardcoding in components
 * All colors should reference the design system when possible
 */

import { radius } from "../design-system/radius";
import { FIGMA_TOKENS } from "../design-system/colors/figmaTokens";
import { SEMANTIC_DARK, SEMANTIC_LIGHT } from "../design-system/colors/semantic";
import { APP_COLORS } from "../../theme/colors";
import { DARK_SURFACE_BRAND_1 } from "../theme/colors/dark";

/** Design system layout: outer margins 20px, section 24px, card 16px */
export const LAYOUT = {
  OUTER_MARGIN: 20,
  SECTION_GAP: 24,
  CARD_GAP: 16,
} as const;

// Modal / bottom sheet / popup – opaque backdrop so overlays are not transparent
export const OVERLAY_COLORS = {
  MODAL_BACKDROP: "rgba(0, 0, 0, 0.6)",
  BACKDROP_LIGHT: "rgba(0, 0, 0, 0.5)",
  BACKDROP_LIGHTER: "rgba(0, 0, 0, 0.4)",
  BACKDROP_OVERLAY: "rgba(0, 0, 0, 0.45)",
  SURFACE_OVERLAY_LIGHT: "rgba(255, 255, 255, 0.2)",
  SURFACE_OVERLAY_DARK: "rgba(0, 0, 0, 0.35)",
  BORDER_SUBTLE: "rgba(0, 0, 0, 0.08)",
  BACKDROP_VERY_LIGHT: "rgba(0, 0, 0, 0.1)",
  SURFACE_OVERLAY_VERY_LIGHT: "rgba(255, 255, 255, 0.1)",
  /** Countdown pill / timer pill background */
  COUNTDOWN_PILL_BG: "rgba(0, 0, 0, 0.4)",
  /** Countdown pill text (white on dark pill) */
  COUNTDOWN_PILL_TEXT: APP_COLORS.modalTextOnPrimary,
  /** Banner close button (e.g. Banner.tsx) */
  BANNER_CLOSE_BG: "rgba(255,255,255,0.95)",
  BANNER_CLOSE_BORDER: "rgba(0,0,0,0.1)",
  /** Lighter backdrop (e.g. loading overlay) */
  BACKDROP_DARKER: "rgba(0, 0, 0, 0.3)",
  /** Bottom sheet / popup backdrop (0.4) */
  BOTTOM_SHEET_BACKDROP: "rgba(0, 0, 0, 0.4)",
  /** Paywall row border (white with opacity) */
  PAYWALL_ROW_BORDER: "rgba(255,255,255,0.35)",
  /** Paywall card border (blue tint) */
  PAYWALL_CARD_BORDER: "rgba(199,99,12,0.9)",
  /** Feed: delete post / comment overlay */
  FEED_OVERLAY: "rgba(0, 0, 0, 0.7)",
  /** Comment item chip background */
  CHIP_BG_DARK: "rgba(0, 0, 0, 0.12)",
  /** Banner overlay (20% dark) */
  BANNER_OVERLAY_20: "rgba(0,0,0,0.2)",
  /** Modal backdrop dark (e.g. Mineral of the Day) */
  MODAL_BACKDROP_DARK: "rgba(0, 0, 0, 0.84)",
  /** Surface overlay (e.g. Rock of Day banner button area) */
  SURFACE_OVERLAY_WHITE_20: "rgba(255, 255, 255, 0.2)",
  /** Border very subtle */
  BORDER_VERY_LIGHT: "rgba(0,0,0,0.06)",
  /** Background very subtle (e.g. preview screen) */
  BG_WHITE_06: "rgba(255,255,255,0.06)",
  /** Map/static overlay */
  OVERLAY_05: "rgba(0, 0, 0, 0.05)",
  /** Premium modal content bg */
  SURFACE_WHITE_75: "rgba(255,255,255,0.75)",
  /** Dev badge orange */
  DEV_BADGE_BG: "rgba(255, 140, 0, 0.85)",
  /** Full black overlay (e.g. photo picker) */
  OVERLAY_95: "rgba(0, 0, 0, 0.95)",
  /** Border white (slider thumb) */
  BORDER_WHITE: APP_COLORS.modalTextOnPrimary,
  /** Modal text on dark (e.g. mineral name) */
  TEXT_WHITE_85: "rgba(255,255,255,0.85)",
  TEXT_WHITE_90: "rgba(255,255,255,0.9)",
} as const;

// Surfaces and text used across screens (prefer theme.colors when available)
export const SCREEN_COLORS = {
  LIGHT: {
    background: SEMANTIC_LIGHT.surface.secondary,
    surface: SEMANTIC_LIGHT.surface.primary,
    surfaceVariant: SEMANTIC_LIGHT.surface.secondary,
    divider: SEMANTIC_LIGHT.border.zero,
    text: SEMANTIC_LIGHT.content.primary,
    textSecondary: SEMANTIC_LIGHT.content.secondary,
    textMuted: SEMANTIC_LIGHT.content.tertiary,
    border: SEMANTIC_LIGHT.border.primary,
  },
  DARK: {
    background: SEMANTIC_DARK.surface.secondary,
    surface: SEMANTIC_DARK.surface.primary,
    surfaceVariant: SEMANTIC_DARK.surface.tertiary,
    divider: SEMANTIC_DARK.border.primary,
    text: SEMANTIC_DARK.content.primary,
    textSecondary: SEMANTIC_DARK.content.secondary,
    textMuted: SEMANTIC_DARK.content.tertiary,
    border: SEMANTIC_DARK.border.primary,
  },
} as const;

// Social Login Colors
export const SOCIAL_COLORS = {
  APPLE_LIGHT: "#000000",
  APPLE_DARK: APP_COLORS.modalTextOnPrimary,
  GOOGLE: "#EA4335",
  FACEBOOK: "#1877F2",
} as const;

// Mushroom-specific accent colors (Figma Brand 1/2 + semantic green)
export const MUSHROOM_COLORS = {
  ACCENT_ORANGE: FIGMA_TOKENS.brand1.primary,
  ACCENT_EARTH: FIGMA_TOKENS.brand2.primary,
  GRADIENT_LIGHT: FIGMA_TOKENS.brand1.light2,
  GRADIENT_MEDIUM: FIGMA_TOKENS.brand2.light2,
  GRADIENT_DARK: FIGMA_TOKENS.brand1.primary,

  // Warning colors
  WARNING_BACKGROUND: "#FEEFEF",
  WARNING_ICON: "#D12C2C",
  WARNING_TEXT: "#7A2A2A",
} as const;

/** @deprecated Use MUSHROOM_COLORS */
export const MINERAL_COLORS = MUSHROOM_COLORS;

// AI Chat & Rock Personality colors - MASTER SPEC
export const AI_CHAT_COLORS = {
  // User bubble (same for light and dark)
  USER_BUBBLE_BG: APP_COLORS.promoCardAskGradientStart,
  USER_BUBBLE_TEXT: "#111111",

  // AI bubble - EXACT SPEC
  AI_BUBBLE_BG_LIGHT: APP_COLORS.surfaceAuthLight,
  AI_BUBBLE_TEXT_LIGHT: "#5D5D5D",
  AI_BUBBLE_BG_DARK: APP_COLORS.surfaceAuthDark,
  AI_BUBBLE_TEXT_DARK: "#D1D1D1",

  // Progress bar
  PROGRESS_FILLED: APP_COLORS.promoCardAskGradientStart,
  PROGRESS_UNFILLED: FIGMA_TOKENS.brand1.light1,

  // Answer boxes - Light Mode - EXACT SPEC
  ANSWER_UNSELECTED_BORDER_LIGHT: SCREEN_COLORS.LIGHT.border,
  ANSWER_UNSELECTED_BG_LIGHT: APP_COLORS.modalTextOnPrimary,
  ANSWER_SELECTED_BORDER_LIGHT: FIGMA_TOKENS.brand2.primary,
  ANSWER_SELECTED_BG_LIGHT: FIGMA_TOKENS.brand2.light2,

  // Answer boxes - Dark Mode - Figma Surface-brand-2-Accent on Surface-Primary
  ANSWER_UNSELECTED_BORDER_DARK: SCREEN_COLORS.DARK.border,
  ANSWER_UNSELECTED_BG_DARK: "#111111",
  ANSWER_SELECTED_BORDER_DARK: DARK_SURFACE_BRAND_1,
  ANSWER_SELECTED_BG_DARK: "#3C2B1A",
  ANSWER_SELECTED_TEXT_DARK: DARK_SURFACE_BRAND_1,

  /** Ask AI suggested question chips — dark: Radius xl, border #DCA50D, bg #111 */
  SUGGESTED_QUESTION_BORDER_DARK: "#DCA50D",
  SUGGESTED_QUESTION_BG_DARK: "#111111",

  // Loader
  LOADER_BORDER: FIGMA_TOKENS.brand1.primary,
  LOADER_BG: APP_COLORS.promoCardAskGradientStart,
  LOADER_SHADOW: FIGMA_TOKENS.brand1.primary,

  // Result page avatar gradient - EXACT SPEC
  AVATAR_GRADIENT_START: "#FDBE62",
  AVATAR_GRADIENT_MID: "#FCB182",
  AVATAR_GRADIENT_END: APP_COLORS.brandPrimaryDark,

  // Loading gradient (Light) - EXACT SPEC
  LOADING_GRADIENT_START: "#F5ECD7",
  LOADING_GRADIENT_END: "#DECA99",

  // Select photo
  SELECT_PHOTO_BG_LIGHT: APP_COLORS.surfaceAuthLight,
  SELECT_PHOTO_BG_DARK: "#111111",
  SELECT_PHOTO_CONTAINER_LIGHT: APP_COLORS.modalTextOnPrimary,
  SELECT_PHOTO_CONTAINER_DARK: "#111111",
  CAPTURE_BORDER_LIGHT: SCREEN_COLORS.LIGHT.border,
  CAPTURE_BORDER_DARK: SCREEN_COLORS.DARK.border,

  // Result cards
  RESULT_CARD_BG_LIGHT: APP_COLORS.surfaceAuthLight,
  RESULT_CARD_BG_DARK: APP_COLORS.surfaceAuthDark,
  SECTION_BADGE_BG_DARK: FIGMA_TOKENS.brand2.light2,
} as const;

// Subscription colors - MASTER SPEC
export const SUBSCRIPTION_COLORS = {
  // Discount banner/timer
  DISCOUNT_TIMER_BG: APP_COLORS.brandLight,
  DISCOUNT_TIMER_TEXT: "#242424",
  TIMER_BADGE_BG: APP_COLORS.brandLight,
  TIMER_BADGE_TEXT: "#242424",

  // Main heading color (both light and dark)
  HEADING_COLOR: APP_COLORS.modalTextOnPrimary,

  // Free vs Premium section (Light mode) - EXACT SPEC
  COMPARISON_LIGHT: {
    BASE_BG: "rgba(255,255,255,0.15)",
    BASE_BORDER: "rgba(255,255,255,0.20)",
    TEXT_PRIMARY: "#111111",
    TEXT_SECONDARY: "#111111",
    PREMIUM_BG: "rgba(255,255,255,0.20)",
    PREMIUM_BORDER: "#C7630C",
    PREMIUM_SHADOW: "rgba(199,99,12,0.35)",
  },

  // Free vs Premium section (Dark mode) - EXACT SPEC
  COMPARISON_DARK: {
    BASE_BG: "rgba(255,255,255,0.15)",
    BASE_BORDER: "rgba(255,255,255,0.20)",
    TEXT_PRIMARY: APP_COLORS.modalTextOnPrimary,
    TEXT_SECONDARY: APP_COLORS.modalTextOnPrimary,
    PREMIUM_BG: "rgba(255,255,255,0.20)",
    PREMIUM_BORDER: "#C7630C",
    PREMIUM_SHADOW: "rgba(199,99,12,0.35)",
  },

  // Subscription card styling - EXACT SPEC
  CARD_SELECTED_BORDER: "#C7630C",
  CARD_SELECTED_SHADOW: "rgba(199,99,12,0.30)",
  CARD_UNSELECTED_BORDER_LIGHT: SCREEN_COLORS.LIGHT.border,
  CARD_UNSELECTED_BORDER_DARK: SCREEN_COLORS.DARK.border,
  CARD_BG_LIGHT: APP_COLORS.modalTextOnPrimary,
  CARD_BG_DARK: "#111111",

  // CTA colors - EXACT SPEC
  CTA_PRIMARY_LIGHT: APP_COLORS.ctaPrimary,
  CTA_TEXT_LIGHT: APP_COLORS.modalTextOnPrimary,
  CTA_PRIMARY_DARK: APP_COLORS.ctaPrimary,
  CTA_TEXT_DARK: APP_COLORS.modalTextOnPrimary,

  // Later button - EXACT SPEC
  LATER_TEXT_LIGHT: "#111111",
  LATER_TEXT_DARK: APP_COLORS.modalTextOnPrimary,

  // Secondary CTA border (Not now, Later, etc.) in popups and bottom sheets
  SECONDARY_CTA_BORDER_LIGHT: "#E7E7E7",
  SECONDARY_CTA_BORDER_DARK: "#333333",

  // Success popup
  POPUP_BG_LIGHT: APP_COLORS.modalTextOnPrimary,
  POPUP_BG_DARK: "#111111",

  // Discount bottom sheets
  BOTTOM_SHEET_BG_LIGHT: APP_COLORS.modalTextOnPrimary,
  BOTTOM_SHEET_BG_DARK: "#111111",
  BOTTOM_SHEET_HANDLE_LIGHT: "#E7E7E7",
  BOTTOM_SHEET_HANDLE_DARK: "#333333",
} as const;

// Subscription gradient colors
export const SUBSCRIPTION_GRADIENTS = {
  INTRO: ["#545529", "#202419"] as const,
} as const;

// Common UI colors
export const UI_COLORS = {
  WHITE: APP_COLORS.modalTextOnPrimary,
  BLACK: "#111111",
  TRANSPARENT: "transparent",
  /** Semantic: error red (buttons, badges) */
  ERROR_RED: APP_COLORS.error,
  /** Semantic: success green fallback */
  SUCCESS_GREEN: APP_COLORS.modalSuccessButtonBg,
  /** Dark arrow/indicator (e.g. Mohs bar) */
  ARROW_DARK: SCREEN_COLORS.DARK.border,
  /** Tertiary/muted text — light #888; dark mode use theme.colors.textTertiary (#888888) */
  TEXT_TERTIARY: "#888888",
  /** Auth: resend timer disabled state */
  RESEND_TIMER_DISABLED: "#E0DACE",
  /** Shadow color for elevation */
  SHADOW: "#000000",
  /** Amber/warn (e.g. log level) */
  WARN_AMBER: "#f59e0b",
  /** Filter modal selected category background fallback */
  FILTER_SELECTED_BG: "#DEE7E4",
  /** Step-by-step wizard progress fill — Figma brand-2 olive */
  WIZARD_PROGRESS: "#747E3B",
  /** Size-scale selected pill border — Figma 8890:124449 */
  WIZARD_SIZE_PILL_BORDER: "#41EDE9",
} as const;

/** Dev/settings fallback colors (e.g. DevEnvironmentInfo when theme not available) */
export const DEV_UI_COLORS = {
  SURFACE_DARK: "#1c1c1e",
  PRIMARY_ORANGE: "#ff9500",
  TEXT_MUTED: "#aaa",
  BORDER_LIGHT: "rgba(255,255,255,0.1)",
  SURFACE_VARIANT_DARK: "#3a3a3c",
} as const;

// Description bubble (mushroom detail intro text)
export const DESCRIPTION_BUBBLE = {
  LIGHT: FIGMA_TOKENS.brand1.light1,
  DARK: "rgba(255, 255, 255, 0.08)",
} as const;

// Brand/accent colors used in multiple places (not always in theme)
export const ACCENT_COLORS = {
  FAB_LIGHT: APP_COLORS.brandLight,
  FAB_DARK: APP_COLORS.brandDarkBg,
  FAB_TEXT_LIGHT: APP_COLORS.brandPrimaryDark,
  FAB_TEXT_DARK: APP_COLORS.brandPrimary,
  ACCENT_BRAND: APP_COLORS.brandPrimary,
  /** @deprecated Use ACCENT_BRAND */
  ACCENT_BLUE: APP_COLORS.brandPrimary,
  WARNING_ORANGE: APP_COLORS.modalRibbonWarning,
  CARD_DARK_BG: "#21190B",
  SHADOW: "#000",
  ON_PRIMARY: APP_COLORS.modalTextOnPrimary,
} as const;

// Feed-specific colors
export const FEED_COLORS = {
  // Background fill colors (below feed asset header image)
  BACKGROUND_FILL_LIGHT: APP_COLORS.surfaceAuthLight,
  BACKGROUND_FILL_DARK: "#111111",

  // Post card styling
  CARD: {
    LIGHT: {
      BACKGROUND: APP_COLORS.modalTextOnPrimary,
      BORDER: SCREEN_COLORS.LIGHT.border,
    },
    DARK: {
      BACKGROUND: "#111111",
      BORDER: SCREEN_COLORS.DARK.border,
    },
  },

  /** Facebook-style active like label and stats (e.g. "Liked", "5 likes") */
  LIKE_ACTIVE: SOCIAL_COLORS.FACEBOOK,

  // FAB (Floating Action Button) — Feed & Collection create button (Figma 8035:46238)
  FAB: {
    LIGHT: {
      BACKGROUND: APP_COLORS.createButtonBg,
      TEXT: APP_COLORS.createButtonFg,
    },
    DARK: {
      BACKGROUND: APP_COLORS.createButtonBg,
      TEXT: APP_COLORS.createButtonFg,
    },
    BORDER_RADIUS: 24,
  },
} as const;

// Hardness/meter gradients (single source)
export const METER_GRADIENT_COLORS = {
  RED_YELLOW_GREEN: ["#F87171", "#FBBF24", "#34D399"] as const,
  MUSHROOM_ACCENT: [
    MUSHROOM_COLORS.GRADIENT_LIGHT,
    MUSHROOM_COLORS.GRADIENT_MEDIUM,
    MUSHROOM_COLORS.GRADIENT_DARK,
  ] as const,
  /** @deprecated Use MUSHROOM_ACCENT */
  MINERAL_GREEN: [
    MUSHROOM_COLORS.GRADIENT_LIGHT,
    MUSHROOM_COLORS.GRADIENT_MEDIUM,
    MUSHROOM_COLORS.GRADIENT_DARK,
  ] as const,
} as const;

// Home screen – discount banner, countdown banner, cards (no fixed widths; use for colors only)
export const HOME_COLORS = {
  // DiscountBanner – Figma spec (ImageBackground + gradient + 50% OFF + timer + CTA + close)
  DISCOUNT_BANNER: {
    BG_LIGHT: "#F5F5F5",
    BG_DARK: "#1A1A1A",
    /** 50% OFF and body text – Figma 8598:66213 (dark text on purple gradient) */
    HEADLINE_LIGHT: "#111111",
    HEADLINE_DARK: "#FFFFFF",
    ENDS_LABEL_LIGHT: "#505050",
    /** Timer box background */
    TIMER_BOX_BG_LIGHT: "#01474F",
    CTA_BG_LIGHT: APP_COLORS.ctaPrimary,
    CTA_TEXT_LIGHT: APP_COLORS.modalTextOnPrimary,
    GRADIENT_LIGHT: ["#E5D4ED", "#9E70B6"] as const,
    FILL_GRADIENT_LIGHT: ["#E8D4F0", "#F3E6F4"] as const,
    /** Timer box (dark mode) — #111 base + amber overlay, gold border */
    TIMER_BOX_BASE_DARK: "#111111",
    TIMER_BOX_OVERLAY_DARK: "rgba(255, 197, 69, 0.12)",
    TIMER_BOX_BORDER_DARK: "#FFE477",
    TIMER_BOX_RADIUS_DARK: 8,
    /** Timer box text */
    TIMER_BOX_TEXT_LIGHT: "#FFFFFF",
    TIMER_BOX_TEXT_DARK: "#FFFFFF",
    /** Subscribe now CTA (dark mode) */
    CTA_BG_DARK: APP_COLORS.ctaPrimary,
    CTA_TEXT_DARK: APP_COLORS.modalTextOnPrimary,
    /** Banner border (dark mode) — Border-brand 2 */
    BORDER_DARK: "rgba(199, 99, 12, 0.16)",
    /** CTA uses SUBSCRIPTION_COLORS; close button background */
    CLOSE_BG_LIGHT: "rgba(0,0,0,0.12)",
    CLOSE_BG_DARK: "rgba(0,0,0,0.3)",
    /** Gradient overlay (dark mode) – from top */
    GRADIENT_DARK: [
      "rgba(0,0,0,0.35)",
      "rgba(0,0,0,0.1)",
      "transparent",
    ] as const,
    /** Close icon (always white on dark circular bg) */
    CLOSE_ICON: APP_COLORS.modalTextOnPrimary,
  },
  // DiscountCountdownBanner — sticky home pill (Figma 10864:63314 dark bg asset)
  COUNTDOWN_BANNER: {
    BG_LIGHT: "#DEE5E6",
    BG_DARK: "transparent",
    BORDER: "#9BB8BA",
    BORDER_GRADIENT_START: "#108C82",
    BORDER_GRADIENT_END: "#C5B8D8",
    BADGE_BG: "#01474F",
    BORDER_DARK: "#FFE477",
    TIME_BOX_BG_LIGHT: APP_COLORS.modalTextOnPrimary,
    TIME_BOX_BG_DARK: "#111111",
    TIME_BOX_OVERLAY_DARK: "rgba(255, 197, 69, 0.12)",
    TIME_BOX_BORDER_LIGHT: "#7B7BAA",
    TIME_BOX_BORDER_DARK: "#FFE477",
    TIME_BOX_RADIUS_LIGHT: 16,
    TIME_BOX_RADIUS_DARK: 26,
    SECONDS_BOX_BORDER_DARK: DARK_SURFACE_BRAND_1,
    SHADOW: "rgba(64, 33, 34, 0.10)",
    SHADOW_DARK: "transparent",
  },
  // Rock of the Day banner
  ROCK_OF_DAY: {
    LABEL_TEXT_LIGHT: APP_COLORS.textPrimaryDark,
    LABEL_TEXT_DARK: APP_COLORS.modalTextOnPrimary,
    TITLE_TEXT_LIGHT: APP_COLORS.textPrimaryDark,
    TITLE_TEXT_DARK: APP_COLORS.modalTextOnPrimary,
    CLOSE_BG: APP_COLORS.overlayLight,
    BUTTON_TEXT: APP_COLORS.modalTextOnPrimary,
  },
  // Other app card (use theme for dark BG/border when available)
  OTHER_APP_CARD: {
    BG_LIGHT: APP_COLORS.modalTextOnPrimary,
    BG_DARK: "#111111",
    GET_TEXT_DARK: "#FFFFFF",
    BORDER_LIGHT: "rgba(0,0,0,0.06)",
    ICON_WRAP_LIGHT: "#F5F5F5",
    /** Get app CTA — dark mode only */
    GET_APP_CTA_BG: APP_COLORS.ctaPrimary,
    GET_APP_CTA_TEXT: APP_COLORS.modalTextOnPrimary,
    GET_APP_CTA_RADIUS: 24,
  },
} as const;

// Card (catalogue, list cards) – radius 12, border and background by mode
export const CARD_COLORS = {
  LIGHT: {
    borderRadius: radius.md,
    border: SCREEN_COLORS.LIGHT.border,
    background: APP_COLORS.modalTextOnPrimary,
  },
  DARK: {
    borderRadius: radius.md,
    border: SCREEN_COLORS.DARK.border,
    background: "#111111",
  },
} as const;

// Collection card – 2-layer card (outer + image card), exact light/dark spec
export const COLLECTION_CARD = {
  LIGHT: {
    outerBorderRadius: 12,
    outerBorderWidth: 1,
    outerBorderColor: SCREEN_COLORS.LIGHT.border,
    outerBackground: APP_COLORS.modalTextOnPrimary,
    titleColor: "#111111",
    subtitleColor: "#5D5D5D",
  },
  DARK: {
    outerBorderRadius: 12,
    outerBorderWidth: 1,
    outerBorderColor: SCREEN_COLORS.DARK.border,
    outerBackground: "#111111",
    titleColor: APP_COLORS.modalTextOnPrimary,
    subtitleColor: "#D1D1D1",
  },
  // Shared: image card and layout (no border on image card)
  imageCardBorderRadius: 8,
  outerPadding: 12,
  outerGap: 8,
  imageCardHeight: 120,
  /** Fourth tile overlay when showing "add" placeholder */
  FOURTH_TILE_OVERLAY: "rgba(0, 0, 0, 0.60)",
  FOURTH_TILE_PLACEHOLDER_BG: "#D9D9D9",
  /** Card icon/text on overlay (e.g. add icon) */
  CARD_ICON_ON_OVERLAY: APP_COLORS.modalTextOnPrimary,
} as const;

// Mushroom details – name origin section background
export const MUSHROOM_DETAILS_EXTRA = {
  NAME_ORIGIN_BG_LIGHT: FIGMA_TOKENS.brand1.light1,
  NAME_ORIGIN_BG_DARK: FIGMA_TOKENS.dark.surface.brand1Accent,
} as const;

/** @deprecated Use MUSHROOM_DETAILS_EXTRA */
export const MINERAL_DETAILS_EXTRA = MUSHROOM_DETAILS_EXTRA;

// Camera – other possible matches screen
export const CAMERA_MATCH_COLORS = {
  MATCH_CARD_BORDER_LIGHT: SCREEN_COLORS.LIGHT.border,
  MATCH_CARD_SHADOW: APP_COLORS.mineralShadowOlive,
  RATE_SECTION_BG_LIGHT: FIGMA_TOKENS.brand1.light1,
  RATE_SECTION_BG_DARK: FIGMA_TOKENS.dark.surface.brand1Accent,
  RATE_TEXT_LIGHT: "#111111",
  RATE_TEXT_DARK: APP_COLORS.modalTextOnPrimary,
  RATE_EMOJI_SELECTED_LIGHT: FIGMA_TOKENS.brand2.text,
  RATE_EMOJI_SELECTED_DARK: FIGMA_TOKENS.brand2.light2,
  IMAGE_OVERLAY_LIGHT: "rgba(17,17,17,0.5)",
  IMAGE_OVERLAY_DARK: APP_COLORS.blurOverlayLightFallback,
  BADGE_OVERLAY_LIGHT: "rgba(17,17,17,0.2)",
  BADGE_OVERLAY_DARK: "rgba(255,255,255,0.3)",
} as const;

// Tab bar (MainTabs) – selected/unselected match Shroom (#111 / #888); line = brand CTA
export const TAB_BAR_COLORS = {
  LIGHT: {
    line: APP_COLORS.ctaPrimary,
    selected: SEMANTIC_LIGHT.content.primary,
    unselected: SEMANTIC_LIGHT.content.tertiary,
    border: SEMANTIC_LIGHT.border.zero,
    background: SEMANTIC_LIGHT.surface.primary,
  },
  DARK: {
    line: APP_COLORS.ctaPrimary,
    selected: SEMANTIC_DARK.content.primary,
    unselected: SEMANTIC_DARK.content.tertiary,
    border: SEMANTIC_DARK.border.zero,
    background: SEMANTIC_DARK.surface.primary,
  },
} as const;

// Subscription paywall screen – shadows and accents
export const PAYWALL_UI_COLORS = {
  SHADOW: "rgba(199, 99, 12, 0.35)",
  PILL_BG: FIGMA_TOKENS.brand1.light2,
  ROW_TEXT_DARK: "#242424",
} as const;

// Home layout – radii, gaps, min heights (no fixed widths for cards)
// Banner cards (Your Mushroom Corner) match subscription banner size (335×148)
export const HOME_LAYOUT = {
  BANNER_RADIUS: 12,
  BANNER_HEIGHT: 168,
  BANNER_PADDING_H: 16,
  BANNER_PADDING_V: 8,
  BANNER_GAP: 8,
  /** Figma 8975:41033 — 335×160 banner art */
  DISCOUNT_BANNER_HEIGHT: 141,
  DISCOUNT_BANNER_DESIGN_WIDTH: 335,
  DISCOUNT_BANNER_DESIGN_HEIGHT: 160,
  DISCOUNT_BANNER_MIN_HEIGHT: 126,
  DISCOUNT_BANNER_MAX_HEIGHT: 144,
  DISCOUNT_BANNER_RADIUS: 16,
  DISCOUNT_BANNER_MARGIN_H: 16,
  DISCOUNT_BANNER_PADDING: 12,
  COUNTDOWN_BANNER_RADIUS: 12,
  /** Dark sticky countdown — reduced corner radius (less pill-like) */
  COUNTDOWN_BANNER_RADIUS_DARK: 12,
  COUNTDOWN_BANNER_MIN_HEIGHT_DARK: 50,
  COUNTDOWN_BANNER_PADDING: 12,
  COUNTDOWN_BANNER_GAP: 16,
  ROCK_OF_DAY_RADIUS: 12,
  ROCK_OF_DAY_PADDING: 16,
  ROCK_OF_DAY_GAP: 22,
  OTHER_APP_CARD_RADIUS: 12,
  OTHER_APP_CARD_MIN_HEIGHT: 220,
  GO_PRO_IMAGE_WIDTH: 97,
  GO_PRO_IMAGE_HEIGHT: 40,
  YOU_ARE_PRO_IMAGE_WIDTH: 125,
  YOU_ARE_PRO_IMAGE_HEIGHT: 40,
} as const;

// Home banners – light mode background colors for BannerCard
export const HOME_BANNER_LIGHT = {
  YOUR_ROCK_CORNER_BG: APP_COLORS.brandLight,
} as const;

// Home banners – dark mode specific colors
export const HOME_BANNER_DARK = {
  YOUR_ROCK_CORNER_BG: APP_COLORS.brandDarkBg,
  /** Text color for "Let's start" and "Get app" buttons in dark mode */
  CTA_TEXT_DARK: APP_COLORS.modalTextOnPrimary,
} as const;

// Catalogue detail (free user) – View Details from catalogue
export const CATALOGUE_DETAIL = {
  IMAGE_HEIGHT: 180,
  IMAGE_RADIUS: 12,
  DOT_SELECTED_WIDTH: 24,
  DOT_SELECTED_HEIGHT: 6,
  DOT_UNSELECTED_SIZE: 6,
  DOT_SELECTED_COLOR: APP_COLORS.modalTextOnPrimary,
  DOT_UNSELECTED_OPACITY: 0.2,
  ARROW_BG_LIGHT: "rgba(255, 255, 255, 0.20)",
  ARROW_BG_DARK: "#6D6D6D",
  PRICE_COLOR: APP_COLORS.brandPrimaryDark,
  TAB_SELECTED_BORDER: APP_COLORS.brandPrimaryDark,
  TAB_UNSELECTED_LIGHT: "#5D5D5D",
  TAB_BAR_BG_DARK: APP_COLORS.brandPrimaryDark,
  TAB_SELECTED_DARK: APP_COLORS.brandPrimary,
  TAB_UNSELECTED_DARK: "#D1D1D1",
  OVERVIEW_CARD_BG_LIGHT: APP_COLORS.surfaceAuthLight,
  OVERVIEW_CARD_BG_DARK: APP_COLORS.surfaceAuthDark,
  OVERVIEW_CARD_TEXT_DARK: "#D1D1D1",
} as const;

/** AI Details Page + Edit Rock Details + Collection — exact UI spec (light/dark) */
export const AI_DETAILS_SPEC = {
  LIGHT: {
    PAGE_BG: APP_COLORS.surfaceAuthLight,
    CARD_BG: APP_COLORS.modalTextOnPrimary,
    BORDER: SCREEN_COLORS.LIGHT.border,
    PRIMARY_TEXT: "#111111",
    SECONDARY_TEXT: "#5D5D5D",
    TAB_ACTIVE_TEXT: "#111111",
    TAB_ACTIVE_UNDERLINE: APP_COLORS.brandPrimaryDark,
    TAB_INACTIVE_TEXT: "#5D5D5D",
    TAB_DIVIDER: SCREEN_COLORS.LIGHT.border,
    SECTION_HEADER: "#111111",
    LABEL: "#5D5D5D",
    VALUE: "#111111",
    ROW_DIVIDER: SCREEN_COLORS.LIGHT.border,
    MAP_CARD_BG: APP_COLORS.modalTextOnPrimary,
    MAP_CARD_BORDER: SCREEN_COLORS.LIGHT.border,
    MOHS_NUMBER: APP_COLORS.brandPrimaryDark,
    MOHS_INDICATOR: "#111111",
    DISCLAIMER_BG: "#FDEAEA",
    DISCLAIMER_BORDER: "#F5C2C7",
    DISCLAIMER_TEXT: "#5D5D5D",
    CTA_BG: APP_COLORS.ctaPrimary,
    CTA_TEXT: APP_COLORS.modalTextOnPrimary,
    CTA_RADIUS: 24,
  },
  DARK: {
    PAGE_BG: APP_COLORS.surfaceAuthDark,
    CARD_BG: "#111111",
    BORDER: SCREEN_COLORS.DARK.border,
    PRIMARY_TEXT: APP_COLORS.modalTextOnPrimary,
    SECONDARY_TEXT: "#D1D1D1",
    TAB_ACTIVE_TEXT: APP_COLORS.modalTextOnPrimary,
    TAB_ACTIVE_UNDERLINE: APP_COLORS.brandPrimary,
    TAB_INACTIVE_TEXT: "#D1D1D1",
    TAB_DIVIDER: SCREEN_COLORS.DARK.border,
    SECTION_HEADER: APP_COLORS.modalTextOnPrimary,
    LABEL: "#D1D1D1",
    VALUE: APP_COLORS.modalTextOnPrimary,
    ROW_DIVIDER: SCREEN_COLORS.DARK.border,
    MAP_CARD_BG: "#111111",
    MAP_CARD_BORDER: SCREEN_COLORS.DARK.border,
    MOHS_NUMBER: APP_COLORS.brandPrimary,
    MOHS_INDICATOR: APP_COLORS.modalTextOnPrimary,
    DISCLAIMER_BG: "rgba(255, 99, 99, 0.1)",
    DISCLAIMER_BORDER: "#5C2B2B",
    DISCLAIMER_TEXT: "#D1D1D1",
    CTA_BG: APP_COLORS.ctaPrimary,
    CTA_TEXT: APP_COLORS.modalTextOnPrimary,
    CTA_RADIUS: 24,
  },
} as const;

/** Edit Rock Details form — input/dropdown/slider spec */
export const EDIT_ROCK_SPEC = {
  LIGHT: {
    PAGE_BG: APP_COLORS.surfaceAuthLight,
    INPUT_BG: APP_COLORS.modalTextOnPrimary,
    INPUT_BORDER: SCREEN_COLORS.LIGHT.border,
    INPUT_TEXT: "#111111",
    PLACEHOLDER: "#888888",
    LABEL: "#5D5D5D",
    INPUT_RADIUS: 12,
    DROPDOWN_ARROW: "#5D5D5D",
    MOHS_NUMBER: APP_COLORS.brandPrimaryDark,
    SECTION_TITLE: "#111111",
  },
  DARK: {
    PAGE_BG: "#111111",
    INPUT_BG: "#171717",
    INPUT_BORDER: SCREEN_COLORS.DARK.border,
    INPUT_TEXT: APP_COLORS.modalTextOnPrimary,
    PLACEHOLDER: FIGMA_TOKENS.dark.text.tertiary,
    LABEL: FIGMA_TOKENS.dark.text.secondary,
    INPUT_RADIUS: 12,
    DROPDOWN_ARROW: FIGMA_TOKENS.dark.text.secondary,
    MOHS_NUMBER: APP_COLORS.brandPrimary,
    SECTION_TITLE: APP_COLORS.modalTextOnPrimary,
  },
} as const;

/** Collection / Catalogue card list — card spec */
export const COLLECTION_CARD_SPEC = {
  LIGHT: {
    CARD_BG: APP_COLORS.modalTextOnPrimary,
    CARD_BORDER: SCREEN_COLORS.LIGHT.border,
    CARD_RADIUS: 12,
    IMAGE_RADIUS: 8,
    TITLE: "#111111",
    SUBTITLE: "#5D5D5D",
  },
  DARK: {
    CARD_BG: "#111111",
    CARD_BORDER: SCREEN_COLORS.DARK.border,
    CARD_RADIUS: 12,
    IMAGE_RADIUS: 8,
    TITLE: APP_COLORS.modalTextOnPrimary,
    SUBTITLE: "#D1D1D1",
  },
} as const;

/** Bottom Sheet and Modal backgrounds */
export const SHEET_COLORS = {
  LIGHT: "#ffffff",
  DARK: "#111111",
} as const;

/** Collection screen backgrounds */
export const COLLECTION_SCREEN_COLORS = {
  LIGHT: {
    collectionBg: APP_COLORS.surfaceAuthLight,
    screenBg: "#ffffff",
  },
  DARK: {
    collectionBg: APP_COLORS.surfaceAuthDark,
    screenBg: "#111111",
  },
} as const;

/** Common button and interactive element colors */
export const INTERACTIVE_COLORS = {
  // Navigation button
  NAV_BUTTON: APP_COLORS.modalTextOnPrimary,
  // Tab bar border
  TAB_BAR_BORDER: SCREEN_COLORS.LIGHT.border,
  // Camera background fallback
  CAMERA_BG_FALLBACK: "#111",
  // Discount/timer background
  DISCOUNT_BG: APP_COLORS.brandLight,
  DISCOUNT_TEXT: "#242424",
} as const;

/** Text color consolidation - light/dark variants */
export const TEXT_COLORS = {
  PRIMARY_LIGHT: "#111111", // Dark text in light mode
  PRIMARY_DARK: APP_COLORS.modalTextOnPrimary, // Light text in dark mode
  SECONDARY_LIGHT: "#5D5D5D", // Secondary text in light mode
  SECONDARY_DARK: FIGMA_TOKENS.dark.text.secondary,
  MUTED_LIGHT: "#949494", // Muted text in light mode
  MUTED_DARK: FIGMA_TOKENS.dark.text.tertiary,
} as const;

/** Border & divider color consolidation - light/dark variants */
export const BORDER_COLORS = {
  LIGHT: SCREEN_COLORS.LIGHT.border, // Border in light mode
  DARK: SCREEN_COLORS.DARK.border, // Border in dark mode
  SUBTLE_LIGHT: "#EAEAEA", // Subtle divider in light mode
  SUBTLE_DARK: FIGMA_TOKENS.dark.border.primary,
} as const;

/** Background color consolidation - component specific */
export const BG_COLORS = {
  LIGHT_SURFACE: APP_COLORS.surfaceAuthLight, // Secondary surface in light mode
  LIGHT_BG: APP_COLORS.modalTextOnPrimary, // Primary background in light mode
  DARK_SURFACE: APP_COLORS.surfaceAuthDark, // Secondary surface in dark mode
  DARK_BG: "#111111", // Primary background in dark mode
} as const;

/** Default location coordinates (zero position) */
export const DEFAULT_COORDINATES = {
  latitude: 0,
  longitude: 0,
} as const;
