import { AppImageBackground } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useIsDark, useTheme } from "../../hooks/useTheme";
import { DiscountBannerDarkSvg, Images } from "../../assets";
import { HOME_COLORS, HOME_LAYOUT } from "../../constants/colorConstants";
import { useStrings } from "../../hooks/useStrings";
import { formatCountdownSegment } from "../../utils";

import { FONTS } from "../../common/typography";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const scaleSize = (size: number, scale: number) => Math.round(size * scale);

/** Figma 8975:41033 — 335×160 banner; slightly shorter than full design height. */
const BANNER_HEIGHT_SCALE = 0.88;

/** Base typography for the dark discount banner. */
const BANNER_TYPE = {
  bigPercent: { size: 28, line: 36 },
  off: { size: 20, line: 24, marginBottom: 6 },
  subscription: { size: 11, line: 14 },
  endsLabel: { size: 12, line: 16 },
  timer: { size: 12, line: 16 },
  cta: { size: 13, line: 16, paddingH: 14, paddingV: 6, radius: 20 },
} as const;

/** Figma 8598:66213 — 50% offer banner. */
const LIGHT_BANNER_TYPE = {
  bigPercent: { size: 32, line: 40 },
  off: { size: 20, line: 28, marginBottom: 0 },
  subscription: { size: 8, line: 11 },
  endsLabel: { size: 12, line: 16 },
  timer: { size: 14, line: 20 },
  cta: { size: 14, line: 20, paddingH: 12, paddingV: 4, radius: 24 },
} as const;

function renderTimerDigits(
  timeLeftDisplay: { hours: number; minutes: number; seconds: number },
  timerColor: string,
  scale: number,
  timerType: { size: number; line: number }
) {
  const timerText = `${formatCountdownSegment(
    timeLeftDisplay.hours
  )} : ${formatCountdownSegment(
    timeLeftDisplay.minutes
  )} : ${formatCountdownSegment(timeLeftDisplay.seconds)}`;

  return (
    <Text
      style={[
        styles.timerBoxText,
        {
          color: timerColor,
          fontSize: scaleSize(timerType.size, scale),
          lineHeight: scaleSize(timerType.line, scale),
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
  hours?: number;
  minutes?: number;
  seconds?: number;
  isDiscountActive?: boolean;
  timerRunning?: boolean;
  bannerHeight?: number;
  dynamicHeight?: boolean;
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
  isDiscountActive: _isDiscountActive,
  timerRunning,
  bannerHeight,
  dynamicHeight = false,
}) => {
  const strings = useStrings();
  const [bannerWidth, setBannerWidth] = useState(0);
  const onBannerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setBannerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
  }, []);
  const theme = useTheme();
  const isDark = useIsDark();
  const db = HOME_COLORS.DISCOUNT_BANNER;
  const headlineColor = isDark ? db.HEADLINE_DARK : db.HEADLINE_LIGHT;
  const endsLabelColor = isDark ? headlineColor : db.ENDS_LABEL_LIGHT;
  const timerColor = isDark ? db.TIMER_BOX_TEXT_DARK : db.TIMER_BOX_TEXT_LIGHT;
  const ctaBg = isDark ? db.CTA_BG_DARK : db.CTA_BG_LIGHT;
  const ctaTextColor = isDark ? db.CTA_TEXT_DARK : db.CTA_TEXT_LIGHT;
  const bannerBorderColor = isDark
    ? theme.colors.surfaceBrand2Accent
    : "transparent";
  const lightTimerBg = db.TIMER_BOX_BG_LIGHT;
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

  const bannerAspect =
    HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH /
    HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_HEIGHT;

  const layout = useMemo(() => {
    const widthForLayout =
      bannerWidth > 0 ? bannerWidth : HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH;
    const scale = clamp(
      widthForLayout / HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH,
      0.82,
      1.2
    );
    const contentPadding = scaleSize(
      HOME_LAYOUT.DISCOUNT_BANNER_PADDING,
      scale
    );

    if (bannerHeight != null) {
      return { height: bannerHeight, scale, contentPadding };
    }

    const rawHeight =
      (widthForLayout / bannerAspect) * (isDark ? BANNER_HEIGHT_SCALE : 1);
    const height = dynamicHeight
      ? Math.round(
          clamp(
            rawHeight,
            HOME_LAYOUT.DISCOUNT_BANNER_MIN_HEIGHT,
            HOME_LAYOUT.DISCOUNT_BANNER_MAX_HEIGHT
          )
        )
      : Math.round(rawHeight);

    return { height, scale, contentPadding };
  }, [bannerAspect, bannerHeight, bannerWidth, dynamicHeight, isDark]);

  const scale = layout.scale;
  const contentPadding = layout.contentPadding;
  const type = isDark ? BANNER_TYPE : LIGHT_BANNER_TYPE;
  const bannerRadius = isDark ? HOME_LAYOUT.DISCOUNT_BANNER_RADIUS : 12;

  return (
    <View
      onLayout={onBannerLayout}
      style={[
        styles.bannerWrapper,
        {
          height: layout.height,
          borderRadius: bannerRadius,
          borderWidth: isDark ? 1 : 0,
          borderColor: bannerBorderColor,
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
        <View style={[styles.bannerImage, { borderRadius: bannerRadius }]}>
          {isDark ? (
            <AppImageBackground
              source={DiscountBannerDarkSvg}
              resizeMode="cover"
              style={styles.bannerFill}
              imageStyle={[
                styles.bannerFillImage,
                { borderRadius: bannerRadius },
              ]}
            >
              <LinearGradient
                colors={[...db.GRADIENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.bannerFill}
              />
            </AppImageBackground>
          ) : (
            <AppImageBackground
              source={Images.homeDiscountBannerLight}
              resizeMode="cover"
              preferRNImage
              style={styles.bannerFill}
              imageStyle={[
                styles.bannerFillImage,
                { borderRadius: bannerRadius },
              ]}
            />
          )}

          <View
            style={[
              styles.bannerContent,
              {
                padding: contentPadding,
                paddingLeft: isDark ? "32%" : 20,
                paddingRight: isDark ? contentPadding : 8,
                alignItems: isDark ? "center" : "flex-start",
              },
            ]}
          >
            <View
              style={[styles.contentStack, !isDark && styles.contentStackLight]}
            >
              <View
                style={[
                  styles.headlineRow,
                  isDark && styles.headlineRowDark,
                  !isDark && styles.headlineRowLight,
                  { marginBottom: scaleSize(4, scale), gap: isDark ? 0 : 3 },
                ]}
              >
                <View style={styles.headlineSub1}>
                  <View
                    style={[
                      styles.percentOffRow,
                      !isDark && styles.percentOffRowLight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bigPercent,
                        !isDark && styles.bigPercentLight,
                        {
                          color: headlineColor,
                          fontSize: scaleSize(type.bigPercent.size, scale),
                          lineHeight: scaleSize(type.bigPercent.line, scale),
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
                          fontSize: scaleSize(type.off.size, scale),
                          lineHeight: scaleSize(type.off.line, scale),
                          marginBottom: scaleSize(type.off.marginBottom, scale),
                          marginLeft: isDark ? 4 : 0,
                        },
                      ]}
                    >
                      {strings.discount.banner.off}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.headlineSub2,
                    { marginTop: isDark ? scaleSize(4, scale) : 0 },
                  ]}
                >
                  <Text
                    style={[
                      styles.onSubscriptionLabel,
                      styles.onSubscriptionFirstLine,
                      !isDark && styles.onSubscriptionFirstLineLight,
                      {
                        color: headlineColor,
                        fontSize: scaleSize(type.subscription.size, scale),
                        lineHeight: scaleSize(type.subscription.line, scale),
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
                        fontSize: scaleSize(type.subscription.size, scale),
                        lineHeight: scaleSize(type.subscription.line, scale),
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
                      marginBottom: scaleSize(isDark ? 6 : 12, scale),
                      gap: scaleSize(isDark ? 6 : 4, scale),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.discountEndsLabel,
                      isDark
                        ? styles.discountEndsLabelDark
                        : styles.discountEndsLabelLight,
                      {
                        color: endsLabelColor,
                        fontSize: scaleSize(type.endsLabel.size, scale),
                        lineHeight: scaleSize(type.endsLabel.line, scale),
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
                          borderRadius: scaleSize(
                            db.TIMER_BOX_RADIUS_DARK,
                            scale
                          ),
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
                        {renderTimerDigits(
                          timeLeftDisplay,
                          timerColor,
                          scale,
                          type.timer
                        )}
                      </View>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.timerSingleView,
                        {
                          backgroundColor: lightTimerBg,
                          paddingHorizontal: scaleSize(4, scale),
                          paddingVertical: 0,
                          height: scaleSize(20, scale),
                          borderRadius: scaleSize(4, scale),
                        },
                      ]}
                    >
                      {renderTimerDigits(
                        timeLeftDisplay,
                        timerColor,
                        scale,
                        type.timer
                      )}
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
                    paddingHorizontal: scaleSize(type.cta.paddingH, scale),
                    paddingVertical: scaleSize(type.cta.paddingV, scale),
                    borderRadius: scaleSize(type.cta.radius, scale),
                    alignSelf: isDark ? "center" : "flex-start",
                    height: scaleSize(28, scale),
                    minHeight: scaleSize(28, scale),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ctaText,
                    !isDark && styles.ctaTextLight,
                    {
                      color: ctaTextColor,
                      fontSize: scaleSize(type.cta.size, scale),
                      lineHeight: scaleSize(type.cta.line, scale),
                    },
                  ]}
                  numberOfLines={1}
                >
                  {strings.discount.banner.subscribeNow}
                </Text>
              </View>
            </View>
          </View>
        </View>
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
    alignSelf: "stretch",
    overflow: "visible",
    position: "relative",
  },
  bannerTouchable: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  bannerImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: HOME_LAYOUT.DISCOUNT_BANNER_RADIUS,
    backgroundColor: HOME_COLORS.DISCOUNT_BANNER.FILL_GRADIENT_LIGHT[0],
  },
  bannerFill: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerFillImage: {
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
  contentStackLight: {
    alignItems: "flex-start",
    maxWidth: "68%",
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },
  headlineRowLight: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  headlineRowDark: {
    justifyContent: "center",
    flexWrap: "nowrap",
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
    flexWrap: "nowrap",
  },
  percentOffRowLight: {
    alignItems: "center",
    gap: 3,
  },
  bigPercent: {
    fontFamily: FONTS.bold,
  },
  /**
   * Figma Title/32px/Black — Satoshi Black (900), 32/40 (size scales with banner width).
   * Weight comes from the Satoshi-Black face itself; adding fontWeight would make
   * Android synthesize extra bold on top of it.
   */
  bigPercentLight: {
    fontFamily: FONTS.black,
    fontStyle: "normal",
    includeFontPadding: false,
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
  onSubscriptionFirstLineLight: {
    marginBottom: 0,
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
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  timerBlockDark: {
    alignSelf: "center",
    maxWidth: "100%",
  },
  timerPillInner: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  timerPillOuter: {
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 1,
    alignSelf: "center",
  },
  discountEndsLabel: {
    fontFamily: FONTS.medium,
  },
  discountEndsLabelLight: {
    flexShrink: 1,
    fontFamily: FONTS.bold,
  },
  discountEndsLabelDark: {
    flexShrink: 1,
  },
  timerSingleView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timerBoxText: {
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
  ctaTextLight: {
    fontFamily: FONTS.medium,
  },
  closeBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 9999,
    elevation: 9999,
    width: 28,
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
