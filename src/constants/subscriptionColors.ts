/**
 * Subscription-specific color constants
 * These colors are used for subscription screens and should be referenced from theme where possible
 */

import { COLORS } from "../design-system/colors";
import { APP_COLORS } from "../../theme/colors";

// Subscription background gradient colors
export const SUBSCRIPTION_GRADIENT_COLORS = {
  // First gradient layer (166.51deg)
  layer1: {
    start: COLORS.primitives.yellow[300].hex, // #EDDB74
    middle: COLORS.primitives.green[300].hex, // #C4D67E (approximate)
    end: COLORS.primitives.green[400].hex, // #91BF92 (approximate)
  },
  // Second gradient layer (167.31deg)
  layer2: {
    start: COLORS.primitives.yellow[100].hex, // #FEFC97 (approximate)
    middle: COLORS.primitives.green[200].hex, // #BFEF89 (approximate)
    end: COLORS.primitives.green[400].hex, // #7ADC79 (approximate)
  },
} as const;

// Discount timer pill gradient
export const DISCOUNT_PILL_GRADIENT = {
  start: COLORS.primitives.green[400].hex, // #64D475
  end: COLORS.primitives.yellow[200].hex, // #DCF068
} as const;

/** Paywall “Discount ends in” pill */
export const DISCOUNT_TIMER_PILL = {
  background: "#01474F",
  backgroundDark: "#01474F",
  text: "#FFFFFF",
} as const;

// CTA button color
export const SUBSCRIPTION_CTA_COLOR = APP_COLORS.ctaPrimary;

// Pricing card colors
export const PRICING_CARD_COLORS = {
  background: COLORS.primitives.green[50].hex, // #EAF6D8 (approximate - using green[50] #EBFFF2)
  border: COLORS.primitives.green[200].hex, // #D7E9B8 (approximate)
  highlightedBackground: COLORS.primitives.green[100].hex, // #E2F2B8 (approximate)
  highlightedBorder: COLORS.primitives.green[400].hex, // #9AC66D (approximate)
  badgeBackground: COLORS.primitives.green[200].hex, // #C8F06A (approximate)
  badgeText: COLORS.primitives.green[800].hex, // #2F5D1E (approximate)
} as const;

// Comparison table colors
export const COMPARISON_TABLE_COLORS = {
  border: COLORS.primitives.grey[200].hex, // #E5E7EB (approximate - using grey[200] #D1D1D1)
} as const;
