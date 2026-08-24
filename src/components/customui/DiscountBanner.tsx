import { AppImageBackground } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useIsDark, useTheme } from "../../hooks/useTheme";
import { DiscountBannerSvg, DiscountBannerDarkSvg } from "../../assets";
import { HOME_COLORS, HOME_LAYOUT } from "../../constants/colorConstants";
import { useStrings } from "../../hooks/useStrings";
import { formatCountdownSegment } from "../../utils";

import { FONTS } from "../../common/typography";

import { APP_COLORS } from "../../config/colors";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const scaleSize = (size: number, scale: number) => Math.round(size * scale);

/** Base typography for discount banner (scaled down slightly for tighter layout). */
const BANNER_TYPE = {
  bigPercent: { size: 32, line: 36 },
  off: { size: 22, line: 26, marginBottom: 8 },
  subscription: { size: 9, line: 13 },
  endsLabel: { size: 11, line: 15 },
  timer: { size: 13, line: 18 },
  cta: { size: 13, line: 18, paddingH: 16, paddingV: 8, radius: 20 },
} as const;

function renderTimerDigits(
  timeLeftDisplay: { hours: number; minutes: number; seconds: number },
  timerColor: string,
  scale: number
) {
  const timerText = `${formatCountdownSegment(timeLeftDisplay.hours)} : ${formatCountdownSegment(timeLeftDisplay.minutes)} : ${formatCountdownSegment(timeLeftDisplay.seconds)}`;

  return (
    <Text
      style={[
        styles.timerBoxText,
        {
          color: timerColor,
          fontSize: scaleSize(BANNER_TYPE.timer.size, scale),
          lineHeight: scaleSize(BANNER_TYPE.timer.line, scale),
        },
      ]}
    >
      {timerText}
    </Text>
  );
}

interface DiscountBannerProps {
  onSubscribe?: () => void;
  onClose?: () => void;
  discountPercent?: number;
  endTime?: Date;
  /** When provided, use this countdown (same as sticky banner) instead of computing from endTime. Keeps both timers in sync. */
  hours?: number;
  minutes?: number;
  seconds?: number;
  /** When false, show wait-phase countdown ("Discount in") or fallback copy instead of 50% OFF. */
  isDiscountActive?: boolean;
  /** @deprecated Use isDiscountActive */
  timerRunning?: boolean;
  /** Fixed banner height (overrides aspect ratio when set). */
  bannerHeight?: number;
  /** Scale height from screen width using design dimensions (335×148 by default). */
  dynamicHeight?: boolean;
  /** Horizontal inset on each side when computing dynamic height (e.g. home screen margin). */
  horizontalMargin?: number;
}

const DiscountBanner: React.FC<DiscountBannerProps> = ({
  onSubscribe,
  onClose,
  discountPercent = 50,
  endTime,
  hours: hoursProp,
  minutes: minutesProp,
  seconds: secondsProp,
  isDiscountActive: isDiscountActiveProp,
  timerRunning,
  bannerHeight,
  dynamicHeight = false,
  horizontalMargin = 0,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isDiscountActive = isDiscountActiveProp ?? timerRunning ?? true;
  const strings = useStrings();
  const theme = useTheme();
  const isDark = useIsDark();
  const db = HOME_COLORS.DISCOUNT_BANNER;
  const headlineColor = isDark ? db.HEADLINE_DARK : db.HEADLINE_LIGHT;
  const timerColor = isDark ? db.TIMER_BOX_TEXT_DARK : APP_COLORS.brandPrimaryDark;
  const ctaBg = isDark ? db.CTA_BG_DARK : APP_COLORS.surfaceWhite;
  const ctaTextColor = isDark ? db.CTA_TEXT_DARK : APP_COLORS.textPrimaryDark;
  const bannerBorderColor = isDark ? theme.colors.surfaceBrand2Accent : "transparent";
  const lightTimerBg = APP_COLORS.errorLightBg;
  const useExternalCountdown =
    hoursProp !== undefined &&
    minutesProp !== undefined &&
    secondsProp !== undefined;

  const targetTimestamp = useMemo(() => {
    if (endTime) return endTime.getTime();
    const t = new Date();
    t.setHours(t.getHours() + 24);
    return t.getTime();
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (useExternalCountdown) return;
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTimestamp - now;
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, useExternalCountdown]);

  const timeLeftDisplay = useExternalCountdown
    ? { hours: hoursProp, minutes: minutesProp, seconds: secondsProp }
    : timeLeft;

  const hasActiveCountdown =
    timeLeftDisplay.hours > 0 ||
    timeLeftDisplay.minutes > 0 ||
    timeLeftDisplay.seconds > 0;

  const layout = useMemo(() => {
    if (bannerHeight != null) {
      return { height: bannerHeight, scale: 1, contentPadding: HOME_LAYOUT.DISCOUNT_BANNER_PADDING };
    }
    if (!dynamicHeight) {
      return { height: null as number | null, scale: 1, contentPadding: HOME_LAYOUT.DISCOUNT_BANNER_PADDING };
    }

    const contentWidth = Math.max(windowWidth - horizontalMargin * 2, 0);
    const scale = clamp(
      contentWidth / HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH,
      0.82,
      1
    );
    const rawHeight =
      contentWidth *
      (HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_HEIGHT /
        HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH);
    const height = Math.round(
      clamp(
        rawHeight,
        HOME_LAYOUT.DISCOUNT_BANNER_MIN_HEIGHT,
        HOME_LAYOUT.DISCOUNT_BANNER_MAX_HEIGHT
      )
    );

    return {
      height,
      scale,
      contentPadding: scaleSize(HOME_LAYOUT.DISCOUNT_BANNER_PADDING, scale),
    };
  }, [bannerHeight, dynamicHeight, horizontalMargin, windowWidth]);

  const resolvedHeight = layout.height;

  // 50% OFF promo only during the active discount phase (first 24h of each cycle).
  if (!isDiscountActive) {
    return null;
  }

  const DISCOUNT_BANNER_ASPECT = 1340 / 640;
  const usesFixedHeight = resolvedHeight != null;
  const { scale, contentPadding } = layout;

  return (
    <View
      style={[
        styles.bannerWrapper,
        {
          borderRadius: HOME_LAYOUT.DISCOUNT_BANNER_RADIUS,
          borderWidth: isDark ? 1 : 0,
          borderColor: bannerBorderColor,
          ...(usesFixedHeight
            ? { height: resolvedHeight }
            : { aspectRatio: DISCOUNT_BANNER_ASPECT }),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSubscribe}
        disabled={!onSubscribe}
        style={styles.bannerTouchable}
        accessibilityRole="button"
      >
        <AppImageBackground
          source={isDark ? DiscountBannerDarkSvg : DiscountBannerSvg}
          resizeMode={usesFixedHeight ? "cover" : "contain"}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: HOME_LAYOUT.DISCOUNT_BANNER_RADIUS }}
        >
        <LinearGradient
          colors={
            isDark
              ? [...db.GRADIENT_DARK]
              : (["transparent", "transparent"] as const)
          }
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.bannerContent,
            { padding: contentPadding, paddingLeft: "32%" },
          ]}
        >
          <View style={styles.contentStack}>
            <View
              style={[
                styles.headlineRow,
                { marginBottom: scaleSize(4, scale) },
              ]}
            >
              <View style={styles.headlineSub1}>
                <View style={styles.percentOffRow}>
                  <Text
                    style={[
                      styles.bigPercent,
                      {
                        color: headlineColor,
                        fontSize: scaleSize(BANNER_TYPE.bigPercent.size, scale),
                        lineHeight: scaleSize(BANNER_TYPE.bigPercent.line, scale),
                      },
                    ]}
                  >
                    {discountPercent}%
                  </Text>
                  <Text
                    style={[
                      styles.offTextInline,
                      {
                        color: headlineColor,
                        fontSize: scaleSize(BANNER_TYPE.off.size, scale),
                        lineHeight: scaleSize(BANNER_TYPE.off.line, scale),
                        marginBottom: scaleSize(BANNER_TYPE.off.marginBottom, scale),
                      },
                    ]}
                  >
                    {strings.discount.banner.off}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.headlineSub2, { marginTop: scaleSize(4, scale) }]}
              >
                <Text
                  style={[
                    styles.onSubscriptionLabel,
                    styles.onSubscriptionFirstLine,
                    {
                      color: headlineColor,
                      fontSize: scaleSize(BANNER_TYPE.subscription.size, scale),
                      lineHeight: scaleSize(BANNER_TYPE.subscription.line, scale),
                    },
                  ]}
                >
                  {strings.discount.banner.on}
                </Text>
                <Text
                  style={[
                    styles.onSubscriptionLabel,
                    {
                      color: headlineColor,
                      fontSize: scaleSize(BANNER_TYPE.subscription.size, scale),
                      lineHeight: scaleSize(BANNER_TYPE.subscription.line, scale),
                    },
                  ]}
                >
                  {strings.discount.banner.subscription}
                </Text>
              </View>
            </View>

            {hasActiveCountdown ? (
              <View
                style={[
                  styles.timerBlock,
                  isDark ? styles.timerBlockDark : styles.timerBlockLight,
                  {
                    marginBottom: scaleSize(6, scale),
                    gap: scaleSize(6, scale),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.discountEndsLabel,
                    isDark ? styles.discountEndsLabelDark : styles.discountEndsLabelLight,
                    {
                      color: headlineColor,
                      fontSize: scaleSize(BANNER_TYPE.endsLabel.size, scale),
                      lineHeight: scaleSize(BANNER_TYPE.endsLabel.line, scale),
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={!isDark}
                  minimumFontScale={isDark ? 1 : 0.85}
                >
                  {strings.discount.banner.discountEndsIn}
                </Text>
                {isDark ? (
                  <View
                    style={[
                      styles.timerPillOuter,
                      {
                        borderRadius: scaleSize(db.TIMER_BOX_RADIUS_DARK, scale),
                        borderColor: db.TIMER_BOX_BORDER_DARK,
                        backgroundColor: db.TIMER_BOX_BASE_DARK,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.timerPillInner,
                        {
                          backgroundColor: db.TIMER_BOX_OVERLAY_DARK,
                          paddingHorizontal: scaleSize(10, scale),
                          paddingVertical: scaleSize(6, scale),
                        },
                      ]}
                    >
                      {renderTimerDigits(timeLeftDisplay, timerColor, scale)}
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.timerSingleView,
                      {
                        backgroundColor: lightTimerBg,
                        paddingHorizontal: scaleSize(10, scale),
                        paddingVertical: scaleSize(6, scale),
                        borderRadius: scaleSize(6, scale),
                      },
                    ]}
                  >
                    {renderTimerDigits(timeLeftDisplay, timerColor, scale)}
                  </View>
                )}
              </View>
            ) : null}

            <View
              style={[
                styles.ctaButton,
                {
                  backgroundColor: ctaBg,
                  marginTop: hasActiveCountdown ? 0 : scaleSize(8, scale),
                  paddingHorizontal: scaleSize(BANNER_TYPE.cta.paddingH, scale),
                  paddingVertical: scaleSize(BANNER_TYPE.cta.paddingV, scale),
                  borderRadius: scaleSize(BANNER_TYPE.cta.radius, scale),
                },
              ]}
            >
              <Text
                style={[
                  styles.ctaText,
                  {
                    color: ctaTextColor,
                    fontSize: scaleSize(BANNER_TYPE.cta.size, scale),
                    lineHeight: scaleSize(BANNER_TYPE.cta.line, scale),
                  },
                ]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {strings.discount.banner.subscribeNow}
              </Text>
            </View>
          </View>
        </View>
        </AppImageBackground>
      </TouchableOpacity>

      {typeof onClose === "function" && (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <CloseIcon
            variant="plain"
            size={20}
            color={isDark ? "#000000" : undefined}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DiscountBanner;

const styles = StyleSheet.create({
  bannerWrapper: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    overflow: "visible",
    position: "relative",
  },
  bannerTouchable: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
  },
  bannerImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: HOME_LAYOUT.DISCOUNT_BANNER_RADIUS,
  },
  bannerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  contentStack: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
    width: "100%",
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },
  headlineSub1: {
    justifyContent: "flex-start",
    marginRight: 4,
  },
  headlineSub2: {
    flex: 0,
    justifyContent: "center",
    marginTop: 4,
  },
  percentOffRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  bigPercent: {
    fontFamily: FONTS.bold,
    paddingBottom: 2,
  },
  offTextInline: {
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  onSubscriptionLabel: {
    fontFamily: FONTS.medium,
  },
  onSubscriptionFirstLine: {
    marginBottom: 2,
  },
  timerBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexWrap: "nowrap",
  },
  timerBlockLight: {
    width: "100%",
    alignSelf: "stretch",
  },
  timerBlockDark: {
    alignSelf: "center",
    maxWidth: "100%",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 4,
  },
  timerPillInner: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timerPillOuter: {
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
    alignSelf: "center",
  },
  timerBracket: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  discountEndsLabel: {
    fontFamily: FONTS.medium,
  },
  discountEndsLabelLight: {
    flexShrink: 1,
  },
  discountEndsLabelDark: {
    flexShrink: 0,
  },
  timerSingleView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    flexShrink: 0,
  },
  timerBox: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 28,
    alignItems: "center",
  },
  timerBoxText: {
    fontFamily: FONTS.bold,
  },
  timerColon: {
    fontFamily: FONTS.bold,
  },
  ctaButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    minHeight: 32,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  closeBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 9999,
    elevation: 9999,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
