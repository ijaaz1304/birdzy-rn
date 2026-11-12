/**
 * SVG Utilities for React Native
 * Uses pixel dimensions (Dimensions.get('window')) to avoid percentage scaling
 * artifacts (hairline seams / subpixel interpolation).
 */

import React from "react";
import { View, ViewStyle, useWindowDimensions } from "react-native";
import { SvgProps } from "react-native-svg";

/**
 * SVG Background Component
 * Wraps SVG content to be used as a background.
 * Uses numeric width/height from Dimensions to prevent fractional pixel seams.
 * No overflow: hidden or borderRadius on wrapper to avoid clipping artifacts.
 */
export interface SvgBackgroundProps {
  SvgComponent: React.ComponentType<SvgProps>;
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  preserveAspectRatio?: string;
  fill?: string;
  opacity?: number;
}

export const SvgBackground: React.FC<SvgBackgroundProps> = ({
  SvgComponent,
  width = "100%",
  height = "100%",
  style,
  preserveAspectRatio = "xMidYMid slice",
  fill,
  opacity = 1,
}) => {
  const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = useWindowDimensions();
  const numericWidth =
    width === "100%" || width === undefined ? WINDOW_WIDTH : Number(width);
  const numericHeight =
    height === "100%" || height === undefined ? WINDOW_HEIGHT : Number(height);

  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: numericWidth,
          height: numericHeight,
          zIndex: 0,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <SvgComponent
        width={numericWidth}
        height={numericHeight}
        preserveAspectRatio={preserveAspectRatio}
        fill={fill}
        opacity={opacity}
      />
    </View>
  );
};
