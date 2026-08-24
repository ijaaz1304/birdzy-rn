/**
 * Camera zoom slider (1×–5×) — Figma capture screen controls.
 * Dragging the thumb (or track) updates VisionCamera zoom via onZoomChange.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, PanResponder, type LayoutChangeEvent } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  CAPTURE_ZOOM_ACCENT,
  CAPTURE_ZOOM_UI_MAX,
  CAPTURE_ZOOM_UI_MIN,
} from "./captureFrameLayout";

const TRACK_WIDTH_FALLBACK = 254;
const ZOOM_STEP = 0.1;
const THUMB_SIZE = 20;

export interface CameraZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  disabled?: boolean;
}

export const CameraZoomControls: React.FC<CameraZoomControlsProps> = ({
  zoom,
  onZoomChange,
  disabled = false,
}) => {
  const [trackWidth, setTrackWidth] = useState(TRACK_WIDTH_FALLBACK);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);
  const trackWidthRef = useRef(TRACK_WIDTH_FALLBACK);
  const onZoomChangeRef = useRef(onZoomChange);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  const clampZoom = useCallback((value: number) => {
    return Math.min(
      CAPTURE_ZOOM_UI_MAX,
      Math.max(CAPTURE_ZOOM_UI_MIN, Math.round(value / ZOOM_STEP) * ZOOM_STEP)
    );
  }, []);

  const setZoomFromPageX = useCallback(
    (pageX: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) return;
      const x = pageX - trackPageXRef.current;
      const ratio = Math.max(0, Math.min(1, x / width));
      const next =
        CAPTURE_ZOOM_UI_MIN +
        ratio * (CAPTURE_ZOOM_UI_MAX - CAPTURE_ZOOM_UI_MIN);
      onZoomChangeRef.current(clampZoom(next));
    },
    [clampZoom]
  );

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x) => {
      trackPageXRef.current = x;
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        // Don't capture — siblings (e.g. shutter) must keep receiving taps.
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          measureTrack();
          setZoomFromPageX(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (evt) => {
          setZoomFromPageX(evt.nativeEvent.pageX);
        },
      }),
    [measureTrack, setZoomFromPageX]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    trackWidthRef.current = width;
    measureTrack();
  };

  const fillPercent =
    ((zoom - CAPTURE_ZOOM_UI_MIN) /
      (CAPTURE_ZOOM_UI_MAX - CAPTURE_ZOOM_UI_MIN)) *
    100;

  const nudge = (delta: number) => {
    onZoomChange(clampZoom(zoom + delta));
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => nudge(-0.5)}
        disabled={disabled || zoom <= CAPTURE_ZOOM_UI_MIN}
        style={styles.iconBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="remove" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View
        ref={trackRef}
        style={styles.trackHit}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${fillPercent}%`,
                backgroundColor: CAPTURE_ZOOM_ACCENT,
              },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                left: `${fillPercent}%`,
                backgroundColor: CAPTURE_ZOOM_ACCENT,
                marginLeft: -THUMB_SIZE / 2,
              },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => nudge(0.5)}
        disabled={disabled || zoom >= CAPTURE_ZOOM_UI_MAX}
        style={styles.iconBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 335,
    paddingHorizontal: 4,
  },
  iconBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  trackHit: {
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "visible",
    justifyContent: "center",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE - 8) / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
