import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Pagination dots + gap + CTA (safe-area padding is on the overlay itself). */
const TABLET_BOTTOM_CHROME_BASE = 76;

/** Minimum gap between slide copy bottom edge and top of dots/CTA overlay. */
export const TABLET_MARKETING_TEXT_BOTTOM_LIFT = 8;

/** Floor for marketing copy bottom inset. */
export const TABLET_MARKETING_TEXT_MIN_BOTTOM = 88;

/** Horizontal inset for marketing copy on tablet. */
export const TABLET_MARKETING_TEXT_HORIZONTAL_PADDING = 18;

/** Compact tablet title — smaller than phone to clear baked-in slide art. */
export const TABLET_MARKETING_TITLE = {
  fontSize: 20,
  lineHeight: 28,
} as const;

/** Compact tablet body. */
export const TABLET_MARKETING_BODY = {
  fontSize: 13,
  lineHeight: 18,
} as const;

/** Max copy width so lines do not stretch across the full iPad canvas. */
export const TABLET_ONBOARDING_TEXT_MAX_WIDTH = 280;

/** Skip link + guest link on tablet onboarding. */
export const TABLET_ONBOARDING_AUX_TEXT = {
  fontSize: 10,
  lineHeight: 13,
} as const;

/** Onboarding composite assets (1500×3252). Used to letterbox correctly on iPad. */
export const TABLET_ONBOARDING_ASSET_WIDTH = 1500;
export const TABLET_ONBOARDING_ASSET_HEIGHT = 3252;
export const TABLET_ONBOARDING_ASSET_ASPECT =
  TABLET_ONBOARDING_ASSET_WIDTH / TABLET_ONBOARDING_ASSET_HEIGHT;

/** Auth slide CTA width as a fraction of the letterboxed asset width. */
export const TABLET_AUTH_CTA_WIDTH_RATIO = 0.94;

/** Gap between auth copy block bottom and top of Sign up / Log in stack. */
export const TABLET_AUTH_TEXT_ABOVE_CTA_GAP = 12;

/** Approximate height of Sign up + Log in + guest link stack. */
export const TABLET_AUTH_CTA_STACK_HEIGHT = 124;

/** Auth slide CTA inset from asset bottom (1500×3252). */
const TABLET_ASSET_AUTH_CTA_BOTTOM = 12;

/** Extra top inset for auth slide title/subtitle on tablet (below safe area). */
export const TABLET_AUTH_TEXT_TOP_OFFSET = 4;

/** Marketing slide copy inset on the phone asset (px). */
const TABLET_ASSET_TEXT_LEFT = 32;
const TABLET_ASSET_TEXT_BOTTOM = 168;

/** Gap between pagination dots and primary CTA on tablet overlay. */
export const TABLET_BOTTOM_SECTION_GAP = 6;

/** Lift pagination dots slightly above the bottom chrome stack. */
export const TABLET_PAGINATION_DOTS_TRANSLATE_Y = -12;

export function getTabletAuthTextTopPadding(insetTop: number): number {
  return Math.max(insetTop, 12) + TABLET_AUTH_TEXT_TOP_OFFSET;
}

export function getTabletAuthCtaBottom(insetBottom: number): number {
  return Math.max(insetBottom, TABLET_ASSET_AUTH_CTA_BOTTOM);
}

/** Auth CTA column — 94% of screen width, centered. */
export function getTabletAuthCtaLayout(screenWidth: number): {
  left: number;
  width: number;
} {
  const ctaWidth = Math.round(screenWidth * TABLET_AUTH_CTA_WIDTH_RATIO);
  return {
    left: (screenWidth - ctaWidth) / 2,
    width: ctaWidth,
  };
}

export function getTabletMarketingTextSectionBottom(
  bottomChromeHeight: number
): number {
  return Math.max(
    TABLET_MARKETING_TEXT_MIN_BOTTOM,
    bottomChromeHeight + TABLET_MARKETING_TEXT_BOTTOM_LIFT
  );
}

export interface TabletContainedImageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Letterboxed frame for phone-ratio onboarding art on tablet. */
export function getTabletContainedImageLayout(
  screenWidth: number,
  screenHeight: number,
  assetAspect: number = TABLET_ONBOARDING_ASSET_ASPECT
): TabletContainedImageLayout {
  const screenAspect = screenWidth / screenHeight;

  if (screenAspect > assetAspect) {
    const height = screenHeight;
    const width = height * assetAspect;
    return {
      x: (screenWidth - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  const width = screenWidth;
  const height = width / assetAspect;
  return {
    x: 0,
    y: (screenHeight - height) / 2,
    width,
    height,
  };
}

/** Marketing slide copy position aligned to the letterboxed asset. */
export function getTabletMarketingTextPosition(
  screenWidth: number,
  screenHeight: number,
  bottomChromeHeight: number
): {
  left: number;
  bottom: number;
  width: number;
  imageLayout: TabletContainedImageLayout;
} {
  const imageLayout = getTabletContainedImageLayout(screenWidth, screenHeight);
  const left =
    imageLayout.x +
    Math.round(
      (imageLayout.width * TABLET_ASSET_TEXT_LEFT) / TABLET_ONBOARDING_ASSET_WIDTH
    );
  const width = Math.min(
    TABLET_ONBOARDING_TEXT_MAX_WIDTH,
    Math.round((imageLayout.width * 280) / TABLET_ONBOARDING_ASSET_WIDTH)
  );
  const bottomFromAsset = Math.round(
    (imageLayout.height * TABLET_ASSET_TEXT_BOTTOM) /
      TABLET_ONBOARDING_ASSET_HEIGHT
  );
  const screenGapBelowImage =
    screenHeight - imageLayout.y - imageLayout.height;
  const bottomFromChrome =
    bottomChromeHeight + TABLET_MARKETING_TEXT_BOTTOM_LIFT;

  return {
    left,
    bottom: Math.max(bottomFromChrome, bottomFromAsset + screenGapBelowImage),
    width,
    imageLayout,
  };
}

export function getTabletBottomChromeHeight(insetBottom: number): number {
  return TABLET_BOTTOM_CHROME_BASE + Math.max(insetBottom, 16);
}

export function useOnboardingTabletLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const bottomChromeHeight = getTabletBottomChromeHeight(insets.bottom);
    return { width, height, bottomChromeHeight };
  }, [width, height, insets.bottom]);
}
