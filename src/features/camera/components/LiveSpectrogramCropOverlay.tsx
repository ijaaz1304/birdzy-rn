import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { soundPerfRender } from "../utils/soundPerf";

const PLAYHEAD_COLOR = "#EF4444";

type Props = {
  /** Animated 0–1 crop window (updated on UI thread during drag). */
  startRatio: SharedValue<number>;
  endRatio: SharedValue<number>;
};

/**
 * Crop selection overlay — isolated from spectrogram SVG so handle drags
 * do not rebuild mel rects.
 */
export const LiveSpectrogramCropOverlay = React.memo(
  function LiveSpectrogramCropOverlay({ startRatio, endRatio }: Props) {
    soundPerfRender("LiveSpectrogramCropOverlay");
    const leftDimStyle = useAnimatedStyle(() => ({
      width: `${Math.max(0, startRatio.value) * 100}%`,
    }));

    const rightDimStyle = useAnimatedStyle(() => ({
      left: `${Math.min(1, endRatio.value) * 100}%`,
    }));

    const windowStyle = useAnimatedStyle(() => {
      const start = Math.max(0, startRatio.value);
      const end = Math.min(1, endRatio.value);
      return {
        left: `${start * 100}%`,
        width: `${Math.max(0, end - start) * 100}%`,
      };
    });

    return (
      <View style={styles.overlayRoot} pointerEvents="none">
        <Animated.View style={[styles.dim, styles.dimLeft, leftDimStyle]} />
        <Animated.View style={[styles.dim, styles.dimRight, rightDimStyle]} />
        <Animated.View style={[styles.cropWindow, windowStyle]}>
          <View style={[styles.handle, styles.handleLeft]} />
          <View style={[styles.handle, styles.handleRight]} />
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dimLeft: {
    left: 0,
  },
  dimRight: {
    right: 0,
  },
  cropWindow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: PLAYHEAD_COLOR,
  },
  handle: {
    position: "absolute",
    top: "50%",
    marginTop: -10,
    width: 10,
    height: 20,
    borderRadius: 40,
    backgroundColor: PLAYHEAD_COLOR,
  },
  handleLeft: {
    left: -6,
  },
  handleRight: {
    right: -6,
  },
});
