/**
 * Reusable Banner Card Component
 * Used for home promotional banners (e.g. Your Mushroom Corner)
 */

import { AppImageBackground } from "@/components/AppImage";
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
  DimensionValue,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { AppText, AppButton } from "../shared";
import { SvgProps } from "react-native-svg";
import { HOME_LAYOUT } from "../../constants/colorConstants";
import { typography } from "../../design-system/typography";

import { FONTS } from "../../common/typography";

import { APP_COLORS } from "../../config/colors";

const BANNER_IMAGE_SHIFT_UP = 0;

export interface BannerCardProps {
  backgroundImage?: ImageSourcePropType | React.ComponentType<SvgProps>;
  backgroundImageDark?: ImageSourcePropType | React.ComponentType<SvgProps>;
  backgroundColor?: string;
  backgroundColorDark?: string;
  /** Optional: linear gradient overlay (e.g. [transparent, APP_COLORS.promoGradientOverlay]). Rendered above bg image in light mode. */
  overlayGradientColors?: readonly [string, string] | string[];
  /** Optional: linear gradient overlay for dark mode. */
  overlayGradientColorsDark?: readonly [string, string] | string[];
  /** Optional: solid overlay color in dark mode when no gradient (e.g. rgba(0,0,0,0.2)). */
  overlayColorDark?: string;
  /** When set, used for button text in dark mode (e.g. #111111 for contrast on dark banners) */
  buttonTextColorDark?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  /** Optional: use when banner background makes theme text hard to read */
  titleColor?: string;
  subtitleColor?: string;
  /** Optional: e.g. '60%' for "Which rock are you" banner secondary text */
  subtitleMaxWidth?: number | string;
  /** Optional: e.g. 2 for subtitle to wrap to 2 lines */
  subtitleNumberOfLines?: number;
  alignment?: "left" | "center";
  width?: number;
  height?: number;
  onPress: () => void;
  onButtonPress?: () => void;
}

// Helper to check if value is a React component
const isReactComponent = (value: any): value is React.ComponentType<any> => {
  return (
    typeof value === "function" ||
    (typeof value === "object" && value !== null && "$$typeof" in value)
  );
};

export const BannerCard: React.FC<BannerCardProps> = ({
  backgroundImage,
  backgroundImageDark,
  backgroundColor,
  backgroundColorDark,
  overlayGradientColors,
  overlayGradientColorsDark,
  overlayColorDark,
  buttonTextColorDark,
  title,
  subtitle,
  buttonText,
  titleColor,
  subtitleColor,
  subtitleMaxWidth,
  subtitleNumberOfLines,
  alignment = "left",
  width,
  height,
  onPress,
  onButtonPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();

  const bgColor = isDark
    ? backgroundColorDark || backgroundColor
    : backgroundColor;
  const bgImage =
    isDark && backgroundImageDark ? backgroundImageDark : backgroundImage;
  const isLeftAligned = alignment === "left";

  let overlayGradient = isDark
    ? overlayGradientColorsDark
    : overlayGradientColors;
  // Temporary: use strong overlay in DEV to confirm gradient is visible (remove after testing)
  const overlaySolidDark =
    isDark && overlayColorDark != null && overlayGradientColorsDark == null;

  const isSvgComponent = bgImage && isReactComponent(bgImage);
  const SvgComponent = isSvgComponent
    ? (bgImage as React.ComponentType<SvgProps>)
    : null;
  const ImageSource =
    bgImage && !isSvgComponent ? (bgImage as ImageSourcePropType) : null;

  const containerStyle = [
    styles.container,
    {
      borderRadius: HOME_LAYOUT.BANNER_RADIUS,
      backgroundColor: bgColor || "transparent",
      height: height ?? HOME_LAYOUT.BANNER_HEIGHT,
      ...(width !== undefined && { width }),
    },
  ];

  const content = (
    <View
      style={[
        styles.content,
        isLeftAligned ? styles.contentLeft : styles.contentCenter,
      ]}
    >
      <View
        style={[
          styles.textContainer,
          isLeftAligned ? styles.textContainerLeft : styles.textContainerCenter,
        ]}
      >
        <AppText
          variant="title20"
          color={titleColor ?? colors.textPrimary}
          style={[
            styles.title,
            { fontFamily: FONTS.bold },
            isLeftAligned ? {} : { textAlign: "center" },
          ]}
        >
          {title}
        </AppText>
        <AppText
          variant="body14"
          color={subtitleColor ?? colors.textSecondary}
          numberOfLines={subtitleNumberOfLines}
          style={[
            styles.subtitle,
            isLeftAligned ? {} : { textAlign: "center" },
            subtitleMaxWidth !== undefined && {
              maxWidth: subtitleMaxWidth as DimensionValue,
            },
          ]}
        >
          {subtitle}
        </AppText>
      </View>
      <AppButton
        title={buttonText}
        size="medium"
        variant="primary"
        onPress={onButtonPress || onPress}
        style={{
          ...styles.bannerCtaButton,
          ...(isLeftAligned ? styles.buttonLeft : styles.buttonCenter),
          backgroundColor: colors.primary,
        }}
        textStyle={{
          ...typography.button.medium,
          fontStyle: "normal",
          color:
            isDark && buttonTextColorDark
              ? buttonTextColorDark
              : colors.onPrimary,
        }}
      />
    </View>
  );

  const overlayElement = (() => {
    if (overlayGradient && overlayGradient.length >= 2) {
      return (
        <LinearGradient
          colors={[
            APP_COLORS.promoGradientTransparent,
            APP_COLORS.promoGradientOverlay,
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.overlay}
          pointerEvents="none"
        />
      );
    }
    if (overlaySolidDark) {
      return (
        <View
          style={[styles.overlay, { backgroundColor: overlayColorDark }]}
          pointerEvents="none"
        />
      );
    }
    return null;
  })();

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isSvgComponent && SvgComponent ? (
        <>
          <View
            style={[
              styles.backgroundImage,
              { transform: [{ translateY: -BANNER_IMAGE_SHIFT_UP }] },
            ]}
          >
            <SvgComponent
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          </View>
          {overlayElement}
          <View style={styles.contentLayer}>{content}</View>
        </>
      ) : ImageSource ? (
        <>
          <AppImageBackground
            source={ImageSource}
            resizeMode="cover"
            style={[
              styles.backgroundImageFill,
              { transform: [{ translateY: -BANNER_IMAGE_SHIFT_UP }] },
            ]}
          />
          {overlayElement}
          <View style={styles.contentLayer}>{content}</View>
        </>
      ) : (
        <>
          {overlayElement}
          <View style={styles.contentLayer}>{content}</View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  backgroundImageFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  // Gradient/solid overlay: above background, below content. No borderRadius — container clips.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: HOME_LAYOUT.BANNER_HEIGHT,
    paddingHorizontal: HOME_LAYOUT.BANNER_PADDING_H,
    paddingVertical: HOME_LAYOUT.BANNER_PADDING_V,
    justifyContent: "space-between",
    gap: HOME_LAYOUT.BANNER_GAP,
  },
  contentLeft: {
    alignItems: "flex-start",
  },
  contentCenter: {
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  textContainerLeft: {
    alignItems: "flex-start",
  },
  textContainerCenter: {
    alignItems: "center",
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  bannerCtaButton: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  buttonLeft: {
    alignSelf: "flex-start",
  },
  buttonCenter: {
    alignSelf: "center",
  },
});
