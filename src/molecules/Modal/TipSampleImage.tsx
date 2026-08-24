/**
 * Identification tip sample image with red cross badge at bottom-right (Figma).
 * Always renders identification/light WebPs — never theme-swaps to dark assets.
 */

import React from "react";
import {
  Image,
  ImageResizeMode,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { APP_COLORS } from "../../config/colors";

const CROSS_BADGE_SIZE = 28;
/** Light backdrop so sample photos read correctly on dark popup chrome. */
const TIP_SAMPLE_BACKDROP = "#FFFFFF";

/** assets/identification/light/*.webp artboard size */
export const TIP_SAMPLE_ASPECT_RATIO = 480 / 320;

export interface TipSampleImageProps {
  source: ImageSourcePropType;
  borderRadius?: number;
  backgroundColor?: string;
  aspectRatio?: number;
  resizeMode?: ImageResizeMode;
  style?: ViewStyle;
}

export const TipSampleImage: React.FC<TipSampleImageProps> = ({
  source,
  borderRadius = 12,
  backgroundColor = TIP_SAMPLE_BACKDROP,
  aspectRatio = TIP_SAMPLE_ASPECT_RATIO,
  resizeMode = "contain",
  style,
}) => (
  <View
    collapsable={false}
    style={[
      styles.wrap,
      {
        borderRadius,
        backgroundColor,
        aspectRatio,
      },
      style,
    ]}
  >
    <Image
      source={source}
      style={[styles.image, { borderRadius, backgroundColor, resizeMode }]}
      resizeMode={resizeMode}
      fadeDuration={0}
      accessibilityIgnoresInvertColors
    />
    <View style={styles.crossBadge} pointerEvents="none">
      <Text style={styles.crossText}>×</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    minHeight: 96,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  crossBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: CROSS_BADGE_SIZE,
    height: CROSS_BADGE_SIZE,
    borderRadius: CROSS_BADGE_SIZE / 2,
    backgroundColor: APP_COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  crossText: {
    color: APP_COLORS.modalTextOnPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "700",
    includeFontPadding: false,
    textAlign: "center",
    marginTop: -1,
  },
});
