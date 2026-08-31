import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { SoundWaveformBars } from "./SoundWaveformBars";

type Props = {
  height?: number;
  playheadRatio?: number;
  windowStartRatio?: number;
  windowEndRatio?: number;
  live?: boolean;
  liveColor?: string;
};

export function SoundSpectrogramView({
  height = 100,
  playheadRatio,
  windowStartRatio,
  windowEndRatio,
  live = false,
  liveColor = "#725481",
}: Props) {
  const hasWindow =
    windowStartRatio != null &&
    windowEndRatio != null &&
    windowEndRatio > windowStartRatio;

  return (
    <View style={[styles.wrap, { height }]}>
      <AppImage
        source={Images.soundSpectrogram}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {live ? (
        <View style={styles.liveOverlay} pointerEvents="none">
          <SoundWaveformBars active color={liveColor} height={height - 16} />
        </View>
      ) : null}
      {hasWindow ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.dim,
              { left: 0, width: `${Math.max(windowStartRatio, 0) * 100}%` },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.dim,
              {
                left: `${Math.min(windowEndRatio, 1) * 100}%`,
                right: 0,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.window,
              {
                left: `${windowStartRatio * 100}%`,
                width: `${(windowEndRatio - windowStartRatio) * 100}%`,
              },
            ]}
          >
            <View style={[styles.handle, styles.handleLeft]} />
            <View style={[styles.handle, styles.handleRight]} />
          </View>
        </>
      ) : playheadRatio != null ? (
        <View
          pointerEvents="none"
          style={[styles.playhead, { left: `${playheadRatio * 100}%` }]}
        />
      ) : null}
    </View>
  );
}

const HANDLE_COLOR = "#EF4444";

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
  },
  liveOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  dim: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  window: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: HANDLE_COLOR,
  },
  handle: {
    position: "absolute",
    top: "50%",
    marginTop: -10,
    width: 10,
    height: 20,
    borderRadius: 40,
    backgroundColor: HANDLE_COLOR,
  },
  handleLeft: {
    left: -6,
  },
  handleRight: {
    right: -6,
  },
  playhead: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: HANDLE_COLOR,
  },
});
