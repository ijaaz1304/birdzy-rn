import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { POST_AUTH_LAYOUT } from "../constants";
import {
  getPostAuthContentLayout,
} from "./postAuthContentLayout";

/** Shared + per-slide layout tokens for post-auth onboarding. */
export type PostAuthLayoutMetrics = {
  isCompact: boolean;
  isVeryCompact: boolean;
  heroSize: number;
  heroWideWidth: number;
  heroWideHeight: number;
  mineralWidth: number;
  mineralHeight: number;
  notificationWidth: number;
  notificationHeight: number;
  contentTopPadding: number;
  titleToHeroGap: number;
  slideTitleFontSize: number;
  slideTitleLineHeight: number;
  slideTitleMarginBottom: number;
  slideSubtitleFontSize: number;
  slideSubtitleLineHeight: number;
  slideBodyFontSize: number;
  slideBodyLineHeight: number;
  subtitleMarginBottom: number;
  bodyMargin: {
    marginTop: number;
    marginBottom: number;
    paddingVertical: number;
  };
  planGap: number;
  planCardCompactMinHeight: number;
  planCardYearlyMinHeight: number;
  planCardPaddingVertical: number;
  priceFontSize: number;
  headerMinHeight: number;
  heroImageMarginBottom: number;
  /** Screen 1 — title block below header. */
  notificationContentTopPadding: number;
  /** Screen 1 — larger notification hero, pushed down. */
  notificationImageMarginTop: number;
  /** Screen 3 — subscription paywall with discount timer. */
  subscriptionTopPadding: number;
  subscriptionBodyPaddingBottom: number;
  subscriptionPlanRowMarginTop: number;
  subscriptionDiscountTimerTop: number;
  /** Post-auth onboarding subscription slide — discount pill offset (Figma 72pt below status bar). */
  postAuthDiscountTimerTop: number;
  /** Post-auth paywall — space between plan cards and the CTA (Figma 36pt). */
  postAuthPlanRowMarginBottom: number;
  /** Post-auth discount slide — top offset for the "Especially for you!" header. */
  postAuthDiscountSlideContentTop: number;
  subscriptionCarouselMarginTop: number;
  subscriptionBottomPadding: number;
  subscriptionCarouselIconSize: number;
  subscriptionCarouselIconMarginBottom: number;
  /** Screen 4 — gift surprise interstitial. */
  surpriseTopPadding: number;
  surpriseTitleGap: number;
  surpriseTitleFontSize: number;
  surpriseTitleLineHeight: number;
  surpriseImageWidth: number;
  surpriseImageHeight: number;
  /** Screen 4 — plan row + CTA spacing. */
  discountPlanRowMarginTop: number;
  discountPlanRowMarginBottom: number;
  discountPaywallTopSpacing: number;
  /** Screen 4 — body + plan cards pushed down below banner. */
  discountContentOffsetTop: number;
  /** Screen 4 — 50% discount banner (tighter on iOS). */
  discountBannerWidth: number;
  discountBannerHeight: number;
  discountSlideTopPadding: number;
  discountTitleFontSize: number;
  discountTitleLineHeight: number;
  /** Gap between “Especially for you!” copy and the 50% banner. */
  discountImageMarginTop: number;
};

export function usePostAuthLayoutMetrics(): PostAuthLayoutMetrics {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isCompact = height < 740;
    const isVeryCompact = height < 680;
    const { isWideScreen, contentWidth } = getPostAuthContentLayout(width, height);
    const layoutContentWidth = isWideScreen
      ? contentWidth
      : Math.min(width - POST_AUTH_LAYOUT.horizontalPadding * 2, POST_AUTH_LAYOUT.contentWidth);

    const heroSize = Math.min(
      layoutContentWidth,
      isVeryCompact ? 200 : isCompact ? 224 : 260
    );
    const heroWideWidth = Math.min(layoutContentWidth, Math.round(heroSize * 1.28));
    const heroWideHeight = Math.round(heroWideWidth * 0.72);

    const notificationWidth = Math.min(layoutContentWidth, isCompact ? 310 : 343);
    const notificationHeight = Math.round(notificationWidth * (1232 / 1120));

    const titleToHeroGap = isCompact ? 24 : 32;
    const contentTopPadding = isVeryCompact ? 48 : isCompact ? 60 : 76;
    const isIos = Platform.OS === "ios";
    const isAndroid = Platform.OS === "android";
    const isLargeScreen = isWideScreen || height >= 800;
    const spaciousSubscription = isAndroid || isLargeScreen;
    const discountBannerScale = isIos
      ? isVeryCompact
        ? 0.54
        : isCompact
        ? 0.64
        : 0.78
      : isVeryCompact
      ? 0.58
      : isCompact
      ? 0.72
      : 0.88;
    const discountBannerWidth = Math.round(heroWideWidth * discountBannerScale);
    const discountBannerHeight = Math.round(
      heroWideHeight * discountBannerScale
    );

    return {
      isCompact,
      isVeryCompact,
      heroSize,
      heroWideWidth,
      heroWideHeight,
      mineralWidth: Math.round(heroSize * 0.58),
      mineralHeight: Math.round(heroSize * 0.68),
      notificationWidth,
      notificationHeight,
      contentTopPadding,
      titleToHeroGap,
      slideTitleFontSize: isCompact ? 20 : 22,
      slideTitleLineHeight: isCompact ? 26 : 28,
      slideTitleMarginBottom: isCompact ? 0 : 4,
      slideSubtitleFontSize: isCompact ? 16 : 18,
      slideSubtitleLineHeight: isCompact ? 22 : 24,
      slideBodyFontSize: isCompact ? 14 : 15,
      slideBodyLineHeight: isCompact ? 20 : 22,
      subtitleMarginBottom: isCompact ? 12 : 24,
      bodyMargin: isCompact
        ? { marginTop: 0, marginBottom: 4, paddingVertical: 0 }
        : { marginTop: 0, marginBottom: 8, paddingVertical: 0 },
      planGap: isCompact ? 8 : 16,
      planCardCompactMinHeight: isVeryCompact ? 44 : isCompact ? 48 : 56,
      planCardYearlyMinHeight: isVeryCompact ? 56 : isCompact ? 60 : 72,
      planCardPaddingVertical: isCompact ? 8 : 12,
      priceFontSize: isCompact ? 16 : 18,
      headerMinHeight: isCompact ? 32 : 44,
      heroImageMarginBottom: isCompact ? 2 : 4,
      notificationContentTopPadding: isCompact ? 20 : 28,
      notificationImageMarginTop: titleToHeroGap + (isCompact ? 20 : 28),
      subscriptionTopPadding: isAndroid
        ? isVeryCompact
          ? 0
          : isCompact
          ? 4
          : 8
        : isVeryCompact
        ? 8
        : isCompact
        ? 12
        : 16,
      subscriptionBodyPaddingBottom: spaciousSubscription
        ? isCompact
          ? 12
          : 24
        : 4,
      subscriptionPlanRowMarginTop: spaciousSubscription
        ? isCompact
          ? 0
          : 0
        : 4,
      subscriptionDiscountTimerTop: 0,
      /**
       * Post-auth subscription slide: Figma puts the discount pill 20pt below the
       * 52pt nav (72pt under the status bar). Our Skip header is 48pt, so offset
       * 24pt on regular phones; tighter on short screens so it clears the carousel.
       */
      postAuthDiscountTimerTop: isVeryCompact ? 8 : isCompact ? 16 : 24,
      /**
       * Post-auth paywall: Figma has 36pt between the plan cards and the CTA
       * (cards end y=660, button starts y=696). Tighter on short screens.
       */
      postAuthPlanRowMarginBottom: isVeryCompact ? 16 : isCompact ? 24 : 36,
      /** Discount slide: title 72pt below status bar in Figma (48pt header + 24). */
      postAuthDiscountSlideContentTop: isVeryCompact ? 8 : isCompact ? 16 : 24,
      subscriptionCarouselMarginTop: isVeryCompact ? 8 : isCompact ? 10 : 12,
      subscriptionBottomPadding: spaciousSubscription
        ? isCompact
          ? 12
          : 24
        : 4,
      subscriptionCarouselIconSize: isVeryCompact
        ? 64
        : spaciousSubscription
        ? isCompact
          ? 80
          : 96
        : 64,
      subscriptionCarouselIconMarginBottom: spaciousSubscription && !isCompact
        ? 20
        : 16,
      surpriseTopPadding: isVeryCompact ? 48 : isCompact ? 56 : 72,
      surpriseTitleGap: isCompact ? 16 : 24,
      surpriseTitleFontSize: isCompact ? 28 : 32,
      surpriseTitleLineHeight: isCompact ? 36 : 40,
      surpriseImageWidth: Math.min(
        layoutContentWidth,
        isCompact ? 220 : 260
      ),
      surpriseImageHeight: Math.round(
        Math.min(
          layoutContentWidth,
          isCompact ? 220 : 260
        ) *
          (1450 / 1500)
      ),
      discountPlanRowMarginTop: isVeryCompact ? 8 : isCompact ? 12 : 24,
      discountPlanRowMarginBottom: isVeryCompact ? 4 : isCompact ? 8 : 28,
      discountPaywallTopSpacing: isVeryCompact ? 8 : isCompact ? 12 : 24,
      discountContentOffsetTop: isVeryCompact ? 0 : isIos ? (isCompact ? 4 : 8) : isCompact ? 6 : 18,
      discountBannerWidth,
      discountBannerHeight,
      discountSlideTopPadding: isIos
        ? isVeryCompact
          ? 4
          : isCompact
          ? 8
          : 12
        : isVeryCompact
        ? 8
        : isCompact
        ? 12
        : 16,
      discountTitleFontSize: isVeryCompact ? 22 : isCompact ? 24 : 26,
      discountTitleLineHeight: isVeryCompact ? 28 : isCompact ? 30 : 34,
      discountImageMarginTop: isVeryCompact ? 12 : isCompact ? 16 : 24,
    };
  }, [height, width]);
}
