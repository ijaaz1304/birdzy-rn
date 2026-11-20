/** Dark Home promotions — Figma 9375:212475; light variants stay at their callsites. */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { AppImage, AppImageBackground } from "../../../components/AppImage";
import { CloseIcon } from "../../../components/shared/CloseIcon";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useStrings } from "../../../hooks/useStrings";
import { formatCountdownSegment } from "../../../utils";
import { APP_COLORS as C } from "../../../../theme/colors";

type Countdown = { hours: number; minutes: number; seconds: number };

export function DarkHomeDiscountBanner({
  time,
  discountPercent,
  height,
  onPress,
  onClose,
}: {
  time: Countdown;
  discountPercent: number;
  height?: number;
  onPress?: () => void;
  onClose?: () => void;
}) {
  const { discount } = useStrings();
  const running = time.hours > 0 || time.minutes > 0 || time.seconds > 0;
  return (
    <View
      style={[
        styles.offer,
        height != null && { height, aspectRatio: undefined },
      ]}
    >
      <TouchableOpacity
        style={styles.fill}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <AppImageBackground
          source={Images.homeDiscountBannerDark}
          style={styles.fill}
          resizeMode="stretch"
        >
          <View style={styles.offerCopy}>
            <View>
              <View style={styles.headline}>
                <Text allowFontScaling={false} style={styles.percent}>
                  {discountPercent}%
                </Text>
                <Text allowFontScaling={false} style={styles.off}>
                  {discount.banner.off}
                </Text>
                <View>
                  <Text allowFontScaling={false} style={styles.subscription}>
                    {discount.banner.on}
                  </Text>
                  <Text allowFontScaling={false} style={styles.subscription}>
                    {discount.banner.subscription}
                  </Text>
                </View>
              </View>
              {running && (
                <View style={styles.inlineTimer}>
                  <Text allowFontScaling={false} style={styles.endsLabel}>
                    {discount.banner.discountEndsIn}
                  </Text>
                  <Text allowFontScaling={false} style={styles.timer}>
                    {[time.hours, time.minutes, time.seconds]
                      .map(formatCountdownSegment)
                      .join(" : ")}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.subscribe}>
              <Text allowFontScaling={false} style={styles.subscribeText}>
                {discount.banner.subscribeNow}
              </Text>
            </View>
          </View>
        </AppImageBackground>
      </TouchableOpacity>
      {onClose && (
        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <CloseIcon isDark style={styles.closeIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function DarkHomeCountdown({
  hours,
  minutes,
  seconds,
  isDiscountActive,
  onPress,
  onClose,
}: Countdown & {
  isDiscountActive: boolean;
  onPress?: () => void;
  onClose?: () => void;
}) {
  const { discount } = useStrings();
  return (
    <View style={styles.countdown}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.countdownBody}
        accessibilityRole="button"
      >
        <AppImage
          source={Images.homeDiscountStickyNest}
          style={styles.nest}
          resizeMode="contain"
        />
        {isDiscountActive && (
          <View style={styles.badge}>
            <Text allowFontScaling={false} style={styles.badgeText}>
              -{discount.countdownBanner.badgePercent}
            </Text>
          </View>
        )}
        <Text allowFontScaling={false} style={styles.countdownLabel}>
          {(isDiscountActive
            ? discount.countdownBanner.label
            : discount.countdownBanner.nextDiscountLabel
          ).trim()}
        </Text>
        <View style={styles.pills}>
          {[`${hours}hr`, `${minutes}m`, `${seconds}s`].map((value, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Text style={styles.colon}>:</Text>}
              <View style={styles.pill}>
                <Text allowFontScaling={false} style={styles.pillText}>
                  {value}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </TouchableOpacity>
      {onClose && (
        <TouchableOpacity
          style={[styles.close, styles.toastClose]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <CloseIcon isDark style={styles.closeIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function DarkHomeProBadge({ label }: { label: string }) {
  return (
    <View style={styles.proOuter}>
      <LinearGradient
        colors={["#41EDE9", "#219699", "#0F7A81", "#9E70B6"]}
        locations={[0.07548, 0.13909, 0.17572, 0.93063]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.48, y: 1 }}
        style={styles.proInner}
      >
        <Text allowFontScaling={false} style={styles.proText}>
          {label}
        </Text>
        <AppImage
          source={Images.homeProMedalDark}
          style={styles.medal}
          resizeMode="contain"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  offer: {
    width: "100%",
    aspectRatio: 335 / 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  offerCopy: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20,
    paddingRight: 12,
    gap: 12,
  },
  headline: { flexDirection: "row", alignItems: "center", gap: 3 },
  percent: {
    fontFamily: FONTS.black,
    fontSize: 32,
    lineHeight: 40,
    color: C.homeTextDark,
  },
  off: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    color: C.homeTextDark,
  },
  subscription: {
    fontFamily: FONTS.medium,
    fontSize: 8,
    lineHeight: 11,
    color: C.homeTextDark,
  },
  inlineTimer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginTop: 4,
  },
  endsLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: C.homeSecondaryTextDark,
  },
  timer: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
    color: C.homeTextDark,
    backgroundColor: "#01474F",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  subscribe: {
    backgroundColor: C.ctaPrimaryDark,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  subscribeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.homeSurfaceDark,
  },
  close: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.homeSurfaceDark,
    borderWidth: 1,
    borderColor: C.homeBorderDark,
  },
  closeIcon: { width: 16, height: 16 },
  countdown: {
    width: "100%",
    backgroundColor: C.homeCardDark,
    borderWidth: 1,
    borderColor: C.homeAccentBorderDark,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#402122",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  countdownBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 44,
    gap: 4,
    minHeight: 28,
  },
  nest: {
    position: "absolute",
    left: -12,
    bottom: -16,
    width: 61,
    height: 61,
    transform: [{ scaleX: -1 }],
  },
  badge: {
    position: "absolute",
    top: -26,
    left: 15,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 360,
    borderWidth: 1,
    borderColor: C.homeAccentBorderDark,
    backgroundColor: "#01474F",
    transform: [{ rotate: "-5.53deg" }],
  },
  badgeText: {
    color: C.homeTextDark,
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  countdownLabel: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.homeTextDark,
  },
  pills: { flexDirection: "row", gap: 4, alignItems: "center" },
  pill: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.homeSurfaceDark,
    borderWidth: 1,
    borderColor: C.homeAccentBorderDark,
    borderRadius: 16,
  },
  pillText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: C.homeTextDark,
  },
  colon: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: C.homeTextDark,
  },
  toastClose: { top: -13, right: -10 },
  proOuter: {
    minWidth: 97,
    borderWidth: 1.5,
    borderColor: "#01474F",
    borderRadius: 360,
    padding: 4,
  },
  proInner: {
    height: 32,
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  proText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.homeTextDark,
  },
  medal: { width: 20, height: 20 },
});
