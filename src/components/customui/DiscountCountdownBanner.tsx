import { AppImage, AppImageBackground } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";
import { HOME_COLORS, HOME_LAYOUT } from "../../constants/colorConstants";
import { useStrings } from "../../hooks/useStrings";

import { FONTS } from "../../common/typography";

interface DiscountCountdownBannerProps {
  hours: number;
  minutes: number;
  seconds: number;
  /** When false, label reads "Discount in" instead of "Discount ends in" */
  isDiscountActive?: boolean;
  onClose?: () => void;
  onPress?: () => void;
}

const DiscountCountdownBanner: React.FC<DiscountCountdownBannerProps> = ({
  hours,
  minutes,
  seconds,
  isDiscountActive = true,
  onClose,
  onPress,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = useStrings();
  const styles = createStyles(theme);

  const countdown = HOME_COLORS.COUNTDOWN_BANNER;
  const wrapperBg = isDark ? countdown.BG_DARK : countdown.BG_LIGHT;
  const wrapperBorder = isDark ? countdown.BORDER_DARK : countdown.BORDER;
  const wrapperRadius = isDark
    ? HOME_LAYOUT.COUNTDOWN_BANNER_RADIUS_DARK
    : HOME_LAYOUT.COUNTDOWN_BANNER_RADIUS;
  const wrapperShadow = isDark ? countdown.SHADOW_DARK : countdown.SHADOW;
  const timeBoxBg = isDark
    ? countdown.TIME_BOX_BG_DARK
    : countdown.TIME_BOX_BG_LIGHT;
  const timeBoxBorder = isDark
    ? countdown.TIME_BOX_BORDER_DARK
    : countdown.TIME_BOX_BORDER_LIGHT;
  const timeBoxRadius = isDark
    ? countdown.TIME_BOX_RADIUS_DARK
    : countdown.TIME_BOX_RADIUS_LIGHT;

  const renderTimeBox = (
    value: number,
    unit: string,
    highlighted = false
  ) => (
    <View
      style={[
        styles.timeBoxVertical,
        {
          borderColor:
            highlighted && isDark
              ? countdown.SECONDS_BOX_BORDER_DARK
              : timeBoxBorder,
          borderWidth: highlighted && isDark ? 2 : 1,
          borderRadius: timeBoxRadius,
        },
      ]}
    >
      {isDark ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.timeBoxDarkFill,
            { borderRadius: timeBoxRadius },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: timeBoxBg,
                borderRadius: timeBoxRadius,
              },
            ]}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: countdown.TIME_BOX_OVERLAY_DARK,
                borderRadius: timeBoxRadius,
              },
            ]}
          />
        </View>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: timeBoxBg, borderRadius: timeBoxRadius },
          ]}
        />
      )}
      <Text style={styles.timeValue}>
        {`${value}${unit}`}
      </Text>
    </View>
  );

  const bannerBody = (
    <>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <View style={styles.closeCircle}>
          <CloseIcon isDark={isDark} style={styles.closeIcon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bannerTouchable}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <AppImage
              source={Images.homeDiscountStickyNest}
              style={styles.giftIcon}
              resizeMode="contain"
            />
            {isDiscountActive ? (
              <View
                style={[
                  styles.percentBadge,
                  { backgroundColor: countdown.BADGE_BG },
                ]}
              >
                <Text
                  style={styles.percentBadgeText}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  -{strings.discount.countdownBanner.badgePercent}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.label} numberOfLines={1}>
            {isDiscountActive
              ? strings.discount.countdownBanner.label.trim()
              : strings.discount.countdownBanner.nextDiscountLabel.trim()}
          </Text>
          <View style={styles.timerRow}>
            {renderTimeBox(hours, "hr")}
            <Text style={styles.colon}>:</Text>
            {renderTimeBox(minutes, "m")}
            <Text style={styles.colon}>:</Text>
            {renderTimeBox(seconds, "s", true)}
          </View>
        </View>
      </TouchableOpacity>
    </>
  );

  if (isDark) {
    return (
      <View
        style={[
          styles.wrapper,
          styles.wrapperDarkShell,
          {
            borderColor: wrapperBorder,
            shadowColor: wrapperShadow,
          },
        ]}
      >
        <View
          style={[
            styles.wrapperDarkBgClip,
            {
              borderRadius: wrapperRadius,
              borderColor: wrapperBorder,
              borderWidth: 1,
            },
          ]}
          pointerEvents="none"
        >
          <AppImageBackground
            source={Images.discountCountdownStickyBgDark}
            style={styles.wrapperDarkBg}
            imageStyle={[
              styles.wrapperDarkImage,
              { borderRadius: wrapperRadius },
            ]}
            resizeMode="stretch"
          />
        </View>
        {bannerBody}
      </View>
    );
  }

  return (
    <View style={styles.outer}>
    <LinearGradient
      colors={[countdown.BORDER_GRADIENT_START, countdown.BORDER_GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradientBorder,
        {
          borderRadius: wrapperRadius,
          shadowColor: wrapperShadow,
        },
      ]}
    >
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: wrapperBg,
            borderRadius: wrapperRadius - 1,
          },
        ]}
      >
        {bannerBody}
      </View>
    </LinearGradient>
    </View>
  );
};

export default DiscountCountdownBanner;

const createStyles = (theme: any) =>
  StyleSheet.create({
    outer: {
      width: "100%",
      alignSelf: "stretch",
      overflow: "visible",
    },
    gradientBorder: {
      width: "100%",
      alignSelf: "stretch",
      padding: 1,
      overflow: "visible",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
    },
    wrapper: {
      width: "100%",
      minHeight: 44,
      maxHeight: 48,
      alignSelf: "stretch",
      justifyContent: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: "visible",
    },
    wrapperDarkShell: {
      borderWidth: 0,
      overflow: "visible",
      position: "relative",
      paddingHorizontal: 10,
      paddingVertical: 4,
      paddingLeft: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
    },
    wrapperDarkBgClip: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      zIndex: 0,
    },
    wrapperDarkBg: {
      width: "100%",
      height: "100%",
    },
    wrapperDarkImage: {
      resizeMode: "stretch",
    },
    closeBtn: {
      position: "absolute",
      top: -12,
      right: -8,
      zIndex: 20,
      elevation: 20,
    },
    closeCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "rgba(0,0,0,0.12)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    closeIcon: {
      width: 14,
      height: 14,
    },
    bannerTouchable: {
      alignSelf: "stretch",
      justifyContent: "center",
      overflow: "visible",
      zIndex: 1,
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "stretch",
      overflow: "visible",
      paddingRight: 12,
    },
    iconBox: {
      width: 40,
      height: 32,
      overflow: "visible",
      position: "relative",
      zIndex: 20,
      elevation: 20,
    },
    giftIcon: {
      position: "absolute",
      width: 40,
      height: 40,
      left: 0,
      bottom: -2,
      zIndex: 1,
    },
    percentBadge: {
      position: "absolute",
      top: -16,
      left: 12,
      height: 16,
      minWidth: 34,
      paddingHorizontal: 5,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 30,
      elevation: 30,
      overflow: "visible",
      transform: [{ rotate: "-14deg" }],
    },
    percentBadgeText: {
      color: "#FFFFFF",
      fontFamily: FONTS.bold,
      fontSize: 10,
      lineHeight: 12,
      includeFontPadding: false,
      textAlign: "center",
      textAlignVertical: "center",
    },
    label: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      lineHeight: 20,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
      flexShrink: 0,
    },
    timeBoxVertical: {
      minWidth: 36,
      height: 24,
      paddingHorizontal: 6,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      overflow: "hidden",
    },
    timeBoxDarkFill: {
      overflow: "hidden",
    },
    timeValue: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      lineHeight: 16,
      color: theme.colors.textPrimary,
      zIndex: 1,
    },
    colon: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
  });
