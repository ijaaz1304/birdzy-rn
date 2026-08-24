/**
 * Rock of the Day Banner Component
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageSourcePropType, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useFeatureConfig } from "../../config/context";
import { useStrings } from "../../hooks/useStrings";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import {
  HOME_COLORS,
  HOME_LAYOUT,
} from "../../constants/colorConstants";
import { Images } from "../../assets";

import { FONTS } from "../../common/typography";

import { spacing } from "../../design-system/spacing";

import { APP_COLORS } from "../../config/colors";

type Props = {
  onOpen: () => void;
  onClose: () => void;
  mushroomImage?: ImageSourcePropType | null;
  mushroomName?: string | null;
  scientificName?: string | null;
};

const _MINERAL_IMAGE_SIZE = 72;
const _MINERAL_IMAGE_RADIUS = 36;
const CARD_RADIUS = HOME_LAYOUT.ROCK_OF_DAY_RADIUS;

const ROCK_GIFT_IMAGE_WIDTH_DEFAULT = 140;
const ROCK_GIFT_IMAGE_HEIGHT_DEFAULT = 110;
const ROCK_GIFT_IMAGE_WIDTH_NARROW = 130;
const ROCK_GIFT_IMAGE_HEIGHT_NARROW = 90;

const NARROW_LAYOUT_BREAKPOINT = 380;

export const RockOfDayBanner = ({ onOpen, onClose }: Props) => {
  const { width: windowWidth } = useWindowDimensions();
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = useStrings();

  const homeConfig = useFeatureConfig("home");

  const isNarrowScreen = windowWidth < NARROW_LAYOUT_BREAKPOINT;
  const rockGiftWidth = isNarrowScreen
    ? ROCK_GIFT_IMAGE_WIDTH_NARROW
    : ROCK_GIFT_IMAGE_WIDTH_DEFAULT;
  const rockGiftHeight = isNarrowScreen
    ? ROCK_GIFT_IMAGE_HEIGHT_NARROW
    : ROCK_GIFT_IMAGE_HEIGHT_DEFAULT;

  const rockColors = HOME_COLORS.ROCK_OF_DAY;
  const labelColor = isDark
    ? rockColors.LABEL_TEXT_DARK
    : rockColors.LABEL_TEXT_LIGHT;

  const labelText = strings.home.birdOfTheDay.label;
  const fullSubtitle =
    homeConfig.featuredBanner.subtitle ??
    strings.home.birdOfTheDay.subtitle;

  const buttonText =
    homeConfig.featuredBanner.buttonText ??
    strings.home.birdOfTheDay.buttonText;

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <LinearGradient
          colors={
            isDark
              ? [
                  APP_COLORS.rockBannerDarkAlpha,
                  APP_COLORS.rockBannerBrown,
                  APP_COLORS.rockBannerBrownAlpha,
                ]
              : [
                  APP_COLORS.rockBannerCreamAlpha,
                  APP_COLORS.rockBannerCream,
                  APP_COLORS.rockBannerPeachAlpha,
                ]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.backgroundImage}
        />

        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <CloseIcon isDark={isDark} style={styles.closeIcon} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.textColumn}>
            <Text
              style={[styles.label, { color: labelColor }]}
              numberOfLines={1}
            >
              {labelText}
            </Text>

            <Text
              style={[styles.line2, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {fullSubtitle}
            </Text>
          </View>

          <View style={styles.rightIcons}>
            <AppImage
              source={isDark ? Images.mushroomGiftDark : Images.mushroomGift}
              style={{
                width: rockGiftWidth,
                height: rockGiftHeight,
              }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.openButton, { backgroundColor: theme.colors.primary }]}
        onPress={onOpen}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.openButtonText,
            { color: isDark ? "#111111" : "#FFFFFF" },
          ]}
        >
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    position: "relative",
    height: 100,
    width: "98%", // 🔥 90% width
    alignSelf: "center", // center it
    borderRadius: CARD_RADIUS,
  },

  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    width: "100%", // 🔥 fixed overflow issue
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
  },

  close: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 24,
    height: 24,
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: spacing[4],
    alignItems: "center",
    justifyContent: "space-between",
  },

  textColumn: {
    flex: 1,
    marginRight: 10,
  },

  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.8,
    fontFamily: FONTS.bold,
  },

  line2: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    flexShrink: 1,
    marginTop: 4,
  },

  rightIcons: {
    flexShrink: 0,
  },

  openButton: {
    position: "absolute",
    bottom: 10,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },

  openButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
