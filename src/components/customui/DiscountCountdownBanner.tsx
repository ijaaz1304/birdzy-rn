import { AppImage, AppImageBackground } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";
import { HOME_COLORS, HOME_LAYOUT } from "../../constants/colorConstants";
import { useStrings } from "../../hooks/useStrings";
import { formatCountdownSegment } from "../../utils";

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
    label: string,
    highlighted = false
  ) => (
    <View
      style={[
        styles.timeBoxVertical,
        {
          borderColor: highlighted
            ? isDark
              ? countdown.SECONDS_BOX_BORDER_DARK
              : theme.colors.primary
            : timeBoxBorder,
          borderWidth: highlighted ? 2 : 1,
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
      <Text style={styles.timeValue}>{formatCountdownSegment(value)}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  const bannerBody = (
    <>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <CloseIcon isDark={isDark} style={styles.closeIcon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bannerTouchable}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <AppImage
              source={Images.homeGiftBox}
              style={styles.giftIcon}
              resizeMode="contain"
            />
          </View>

          <View style={styles.timerBlock}>
            <Text style={styles.label}>
              {isDiscountActive
                ? strings.discount.countdownBanner.label
                : strings.discount.countdownBanner.nextDiscountLabel}
            </Text>
            <View style={styles.timerRow}>
              {renderTimeBox(
                hours,
                strings.discount.countdownBanner.hours
              )}
              <Text style={styles.colon}>:</Text>
              {renderTimeBox(
                minutes,
                strings.discount.countdownBanner.minutes
              )}
              <Text style={styles.colon}>:</Text>
              {renderTimeBox(
                seconds,
                strings.discount.countdownBanner.seconds,
                true
              )}
            </View>
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
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: wrapperBg,
          borderColor: wrapperBorder,
          borderRadius: wrapperRadius,
          shadowColor: wrapperShadow,
        },
      ]}
    >
      {bannerBody}
    </View>
  );
};

export default DiscountCountdownBanner;

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      alignSelf: "stretch",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 10,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
      overflow: "visible",
    },
    wrapperDarkShell: {
      borderWidth: 0,
      overflow: "visible",
      position: "relative",
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
      top: -16,
      right: -16,
      zIndex: 9999,
      elevation: 9999,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    closeIcon: {
      width: 24,
      height: 24,
    },
    bannerTouchable: {
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
      paddingRight: 4,
      zIndex: 1,
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      gap: 8,
      alignSelf: "stretch",
      overflow: "visible",
      flexShrink: 1,
    },
    iconBox: {
      width: 32,
      height: 32,
      overflow: "visible",
      alignItems: "flex-end",
      justifyContent: "flex-end",
    },
    giftIcon: {
      width: 96,
      height: 96,
      left: 40,
      top: 18,
    },
    timerBlock: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      gap: 6,
      flexShrink: 0,
      marginLeft: 12,
    },
    label: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    timeBoxVertical: {
      width: 40,
      height: 26,
      paddingHorizontal: 6,
      paddingVertical: 0,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      flexDirection: "row",
      overflow: "hidden",
    },
    timeBoxDarkFill: {
      overflow: "hidden",
    },
    timeValue: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      lineHeight: 20,
      color: theme.colors.textPrimary,
      zIndex: 1,
    },
    timeLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.colors.textPrimary,
      zIndex: 1,
    },
    colon: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      lineHeight: 20,
      marginHorizontal: 0,
      color: theme.colors.textPrimary,
    },
  });
