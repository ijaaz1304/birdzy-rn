import { Platform } from "react-native";
import { POST_AUTH_PHONE_MAX_WIDTH } from "@/features/post-auth-onboarding/utils/postAuthContentLayout";
import { isTabletDevice } from "@/utils/tabletLayout";

/** GlowingWaveSpecimenCard star frame aspect (1348×1094). */
export const MUSHROOM_HERO_FRAME_ASPECT = 1348 / 1094;

export const MUSHROOM_OF_DAY_MODAL_REF = {
  width: 390,
  height: 844,
} as const;

/** Dark heading asset (basket + ribbon) — 1005×498. */
export const MUSHROOM_OF_DAY_HEADER_ASPECT = 1005 / 498;
/** Light heading asset — bird_of_the_day_popup.webp (1340×680). */
export const MUSHROOM_OF_DAY_HEADER_LIGHT_ASPECT = 1340 / 680;

export const MUSHROOM_OF_DAY_MODAL_LAYOUT = {
  closeTopBelowSafe: 32,
  closeInsetRight: 20,
  headerMaxWidth: 300,
  heroMaxWidth: 340,
  heroBandCenterBias: 0.34,
  minBandGap: 10,
  textToCtaGap: 12,
  ctaMinHeight: 44,
  ctaRowGap: 8,
  footerBottomRatio: 148 / 844,
  footerBottomMin: 56,
  scientificNameLineHeight: 28,
  commonNameHeight: 20,
  priceLineHeight: 22,
} as const;

export type BirdOfTheDayModalLayoutInput = {
  windowWidth: number;
  windowHeight: number;
  safeTop: number;
  safeBottom: number;
  hasScientificName: boolean;
  hasPrice: boolean;
  showRefresh: boolean;
  measuredFooterHeight?: number;
  platform?: "ios" | "android" | "web" | "windows" | "macos";
};

export type BirdOfTheDayModalComputedLayout = {
  contentWidth: number;
  contentLeft: number;
  closeRight: number;
  closeTop: number;
  contentPaddingTop: number;
  headerWidth: number;
  headerHeight: number;
  heroWidth: number;
  heroHeight: number;
  heroLayerTop: number;
  footerBottom: number;
  textToCtaGap: number;
  buttonPaddingHorizontal: number;
};

function estimateFooterHeight(
  hasScientificName: boolean,
  hasPrice: boolean,
  compact: boolean
): number {
  const L = MUSHROOM_OF_DAY_MODAL_LAYOUT;
  let height = L.commonNameHeight + 5;
  if (hasScientificName) {
    height += L.scientificNameLineHeight + 5;
  }
  if (hasPrice) {
    height += L.priceLineHeight + 4;
  }
  height += L.textToCtaGap + L.ctaMinHeight + (compact ? 8 : 16);
  return height;
}

/**
 * Responsive mushroom-of-the-day layout (ported from plant-app PlantOfTheDayModal).
 * Footer stays pinned to the bottom; hero sits in the band between header art and footer.
 */
export function computeBirdOfTheDayModalLayout(
  input: BirdOfTheDayModalLayoutInput
): BirdOfTheDayModalComputedLayout {
  const {
    windowWidth,
    windowHeight,
    safeTop,
    safeBottom,
    hasScientificName,
    hasPrice,
    measuredFooterHeight,
  } = input;

  const refW = MUSHROOM_OF_DAY_MODAL_REF.width;
  const refH = MUSHROOM_OF_DAY_MODAL_REF.height;
  const isTablet = isTabletDevice(windowWidth, windowHeight);
  const contentWidth = isTablet
    ? Math.min(POST_AUTH_PHONE_MAX_WIDTH, Math.max(windowWidth - 40, 0))
    : windowWidth;
  const contentLeft = (windowWidth - contentWidth) / 2;

  const heightScale = Math.min(1, Math.max(0.72, windowHeight / refH));
  const widthScale = Math.min(1, Math.max(0.72, contentWidth / refW));
  const scale = Math.min(heightScale, widthScale);
  const compact = windowHeight < 700;
  const isAndroid = (input.platform ?? Platform.OS) === "android";

  const closeTop = Math.max(safeTop, 12) + MUSHROOM_OF_DAY_MODAL_LAYOUT.closeTopBelowSafe;
  const closeRight =
    (windowWidth - contentWidth) / 2 + MUSHROOM_OF_DAY_MODAL_LAYOUT.closeInsetRight;

  const contentPaddingTop = closeTop + 36;
  const headerWidth = Math.round(
    Math.min(
      MUSHROOM_OF_DAY_MODAL_LAYOUT.headerMaxWidth * widthScale,
      contentWidth - 48
    )
  );
  const headerHeight = Math.round(
    (headerWidth / MUSHROOM_OF_DAY_HEADER_ASPECT) * (compact ? 0.92 : 1)
  );

  let heroWidth = Math.round(
    Math.min(
      MUSHROOM_OF_DAY_MODAL_LAYOUT.heroMaxWidth * widthScale,
      contentWidth - 40,
      windowHeight * 0.34
    )
  );
  let heroHeight = Math.round(heroWidth / MUSHROOM_HERO_FRAME_ASPECT);

  const footerBottomInset = Math.max(
    MUSHROOM_OF_DAY_MODAL_LAYOUT.footerBottomMin,
    Math.round(
      windowHeight *
        (isAndroid ? 0.14 : MUSHROOM_OF_DAY_MODAL_LAYOUT.footerBottomRatio)
    )
  );
  const footerBottom = footerBottomInset + safeBottom;
  const footerHeight =
    measuredFooterHeight && measuredFooterHeight > 0
      ? measuredFooterHeight
      : estimateFooterHeight(hasScientificName, hasPrice, compact);

  const headerBottomY = contentPaddingTop + headerHeight;
  const footerTopY = windowHeight - footerBottom - footerHeight;
  const minGap = compact ? 6 : MUSHROOM_OF_DAY_MODAL_LAYOUT.minBandGap;

  const bandStart = headerBottomY + minGap;
  const bandEnd = footerTopY - minGap;
  const bandHeight = bandEnd - bandStart;

  let heroLayerTop = bandStart;
  if (bandHeight > heroHeight) {
    heroLayerTop =
      bandStart +
      (bandHeight - heroHeight) * MUSHROOM_OF_DAY_MODAL_LAYOUT.heroBandCenterBias;
  } else if (bandHeight > 0 && bandHeight < heroHeight) {
    heroWidth = Math.max(Math.round(180 * scale), Math.floor(bandHeight - minGap));
    heroHeight = Math.round(heroWidth / MUSHROOM_HERO_FRAME_ASPECT);
    heroLayerTop =
      bandStart +
      Math.max(0, (bandHeight - heroHeight) * MUSHROOM_OF_DAY_MODAL_LAYOUT.heroBandCenterBias);
  }

  heroLayerTop = Math.max(bandStart, heroLayerTop - (compact ? 10 : 18));

  return {
    contentWidth,
    contentLeft,
    closeRight,
    closeTop,
    contentPaddingTop,
    headerWidth,
    headerHeight,
    heroWidth,
    heroHeight,
    heroLayerTop: Math.round(heroLayerTop),
    footerBottom,
    textToCtaGap: compact ? 10 : MUSHROOM_OF_DAY_MODAL_LAYOUT.textToCtaGap,
    buttonPaddingHorizontal: 20,
  };
}
