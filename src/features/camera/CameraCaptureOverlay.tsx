/**
 * Figma capture overlay — dark scrim everywhere except the rounded capture frame.
 * Corner bracket guides only (no full border).
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Mask, Path, Rect } from "react-native-svg";
import {
  CAPTURE_FRAME_CORNER_ARM,
  CAPTURE_FRAME_CORNER_STROKE,
  CAPTURE_OVERLAY_SCRIM,
  buildCaptureFrameCornerPaths,
  type CaptureFrameLayout,
} from "./captureFrameLayout";

type CameraCaptureOverlayProps = {
  layout: CaptureFrameLayout;
};

export const CameraCaptureOverlay: React.FC<CameraCaptureOverlayProps> = ({
  layout,
}) => {
  const {
    screenWidth,
    screenHeight,
    frameSize,
    frameLeft,
    frameTop,
    frameRadius,
  } = layout;

  const cornerPaths = useMemo(
    () =>
      buildCaptureFrameCornerPaths(
        frameLeft,
        frameTop,
        frameSize,
        frameRadius,
        CAPTURE_FRAME_CORNER_ARM
      ),
    [frameLeft, frameTop, frameSize, frameRadius]
  );

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <Mask id="captureFrameMask">
            <Rect
              x={0}
              y={0}
              width={screenWidth}
              height={screenHeight}
              fill="white"
            />
            <Rect
              x={frameLeft}
              y={frameTop}
              width={frameSize}
              height={frameSize}
              rx={frameRadius}
              ry={frameRadius}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          fill={CAPTURE_OVERLAY_SCRIM}
          mask="url(#captureFrameMask)"
        />
        {cornerPaths.map((d, index) => (
          <Path
            key={index}
            d={d}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={CAPTURE_FRAME_CORNER_STROKE}
            strokeLinecap="square"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
