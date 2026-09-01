/**
 * Static / file-based spectrogram (Figma placeholder scroll).
 * Used on SoundCropScreen for crop window UI.
 *
 * Live recording uses {@link LiveSpectrogramView} + PCM FFT instead (no Expo).
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Images } from "../../../assets";

type Props = {
  height?: number;
  /** @deprecated Live recording — use LiveSpectrogramView */
  liveProgress?: number;
  playheadRatio?: number;
  playheadCenter?: boolean;
  windowStartRatio?: number;
  windowEndRatio?: number;
};

const PLAYHEAD_COLOR = "#EF4444";
const TILE_COUNT = 3;

export function SoundSpectrogramView({
  height = 100,
  liveProgress,
  playheadRatio,
  playheadCenter = false,
  windowStartRatio,
  windowEndRatio,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const hasWindow =
    windowStartRatio != null &&
    windowEndRatio != null &&
    windowEndRatio > windowStartRatio;

  /* --- Static Figma texture scroll (commented out for live recording) ---
  const scrollProgress = Math.min(1, Math.max(0, liveProgress ?? 0));
  const stripWidth = trackWidth * TILE_COUNT;
  const maxScroll = Math.max(0, stripWidth - trackWidth);
  const scrollX = -scrollProgress * maxScroll;
  --- end static scroll --- */

  const scrollProgress = Math.min(1, Math.max(0, liveProgress ?? 0));
  const stripWidth = trackWidth * TILE_COUNT;
  const maxScroll = Math.max(0, stripWidth - trackWidth);
  const scrollX = -scrollProgress * maxScroll;

  const showCenterPlayhead =
    !hasWindow && (playheadCenter || liveProgress != null);
  const showRatioPlayhead =
    !hasWindow && !showCenterPlayhead && playheadRatio != null;

  const tiles = useMemo(
    () => Array.from({ length: TILE_COUNT }, (_, index) => index),
    []
  );

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {liveProgress != null && trackWidth > 0 ? (
        <View style={styles.clip}>
          <View
            style={[
              styles.strip,
              { width: stripWidth, height, transform: [{ translateX: scrollX }] },
            ]}
          >
            {tiles.map((index) => (
              <AppImage
                key={index}
                source={Images.soundSpectrogram}
                style={[styles.tile, { width: trackWidth, height, left: trackWidth * index }]}
                resizeMode="stretch"
              />
            ))}
          </View>
        </View>
      ) : (
        <AppImage
          source={Images.soundSpectrogram}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {hasWindow ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.dim,
              { left: 0, width: `${Math.max(windowStartRatio!, 0) * 100}%` },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.dim,
              {
                left: `${Math.min(windowEndRatio!, 1) * 100}%`,
                right: 0,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.window,
              {
                left: `${windowStartRatio! * 100}%`,
                width: `${(windowEndRatio! - windowStartRatio!) * 100}%`,
              },
            ]}
          >
            <View style={[styles.handle, styles.handleLeft]} />
            <View style={[styles.handle, styles.handleRight]} />
          </View>
        </>
      ) : null}

      {showCenterPlayhead ? (
        <View pointerEvents="none" style={styles.playheadCenter} />
      ) : null}

      {showRatioPlayhead ? (
        <View
          pointerEvents="none"
          style={[styles.playhead, { left: `${playheadRatio! * 100}%` }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E8E8E8",
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  strip: {
    position: "relative",
  },
  tile: {
    position: "absolute",
    top: 0,
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
  playhead: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: PLAYHEAD_COLOR,
  },
  playheadCenter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    marginLeft: -1,
    backgroundColor: PLAYHEAD_COLOR,
  },
});
