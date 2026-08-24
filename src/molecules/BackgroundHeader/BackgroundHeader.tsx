/**
 * Shared background header for modals and bottom sheets.
 * Used by: full-screen modals (e.g. Congratulations), bottom sheets (Rate Us, Feedback, Notification, Version Update).
 * NOT used by: Mushroom of the Day (MushroomOfTheDayModal).
 */

import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { AppImageBackground } from "@/components/AppImage";
import { SvgProps } from "react-native-svg";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";

const isReactComponent = (
  value: unknown
): value is React.ComponentType<SvgProps> =>
  typeof value === "function" ||
  (typeof value === "object" && value !== null && "$$typeof" in value);

export type BackgroundResizeMode = "cover" | "contain" | "stretch";

export interface BackgroundHeaderProps {
  /** Height of the header area. Default 160. */
  height?: number;
  /** Optional custom background: image source or SVG component (e.g. popUp 50/70). */
  backgroundImage?: ImageSourcePropType | React.ComponentType<SvgProps>;
  /** Resize mode for background image. 'contain' fits image inside area; 'cover' keeps aspect ratio and fills; 'stretch' fills and may distort. */
  imageResizeMode?: BackgroundResizeMode;
}

const DEFAULT_HEIGHT = 160;

export const BackgroundHeader: React.FC<BackgroundHeaderProps> = ({
  height = DEFAULT_HEIGHT,
  backgroundImage,
  imageResizeMode = "cover",
}) => {
  const _theme = useTheme();
  const isDark = useIsDark();

  const bgSource =
    backgroundImage ?? (isDark ? Images.popUp50Dark : Images.popUp50Light);

  const isSvg = isReactComponent(bgSource);
  const SvgComponent = isSvg
    ? (bgSource as React.ComponentType<SvgProps>)
    : null;

  const aspectRatioPreserve =
    imageResizeMode === "stretch"
      ? "none"
      : imageResizeMode === "contain"
      ? "xMidYMid meet"
      : "xMidYMid slice";
  const imageResize =
    imageResizeMode === "contain" ? "contain" : imageResizeMode;
  return (
    <View style={[styles.wrapper, { height }]}>
      {isSvg && SvgComponent ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SvgComponent
            width="100%"
            height="100%"
            preserveAspectRatio={aspectRatioPreserve}
          />
        </View>
      ) : (
        <AppImageBackground
          source={bgSource as ImageSourcePropType}
          style={StyleSheet.absoluteFill}
          resizeMode={imageResize}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
  },
});
