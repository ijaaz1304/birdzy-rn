/**
 * Post-recording waveform. Selected range is highlighted; tap plays that range.
 */

import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { useIsDark, useTheme } from "../../../hooks/useTheme";
import { formatSoundMmSs } from "../utils/soundCrop";
import { LiveSpectrogramView } from "./LiveSpectrogramView";
import { SoundPlayButton } from "./SoundPlayButton";

const HANDLE_COLOR = "#F2546A";
const TRACK_HEIGHT = 112;

type Props = {
  columns: number[][];
  durationSec: number;
  windowSec: number;
  selectionStartSec: number;
  isPlaying: boolean;
  disabled?: boolean;
  onTogglePlay: () => void;
  onSelectionStartChange: (startSec: number) => void;
};

const copy = CAMERA_STRINGS.sound;

export function RecordedSoundPreview({
  columns,
  durationSec,
  windowSec,
  selectionStartSec,
  isPlaying,
  disabled = false,
  onTogglePlay,
  onSelectionStartChange,
}: Props) {
  const theme = useTheme();
  const isDark = useIsDark();
  const colors = theme.colors;
  const trackBg = isDark ? "#2C2C30" : "#ECECEF";
  // Waveform colors, kept with the commented bar renderer.
  // const idleBar = isDark ? "rgba(255,255,255,0.38)" : "#C5C5CC";
  // const selectedBar = colors.primaryCTA;

  const startRatio = useSharedValue(ratio(selectionStartSec, durationSec));
  const endRatio = useSharedValue(
    ratio(selectionStartSec + windowSec, durationSec)
  );
  const trackWidth = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const dragging = useSharedValue(false);

  useEffect(() => {
    if (dragging.value) return;
    startRatio.value = ratio(selectionStartSec, durationSec);
    endRatio.value = ratio(selectionStartSec + windowSec, durationSec);
  }, [
    dragging,
    durationSec,
    endRatio,
    selectionStartSec,
    startRatio,
    windowSec,
  ]);

  const pan = Gesture.Pan()
    .enabled(!disabled && durationSec > windowSec + 0.05)
    .activeOffsetX([-12, 12])
    .onStart(() => {
      dragging.value = true;
      dragOrigin.value = startRatio.value * durationSec;
    })
    .onUpdate((event) => {
      const deltaSec =
        (event.translationX / Math.max(1, trackWidth.value)) * durationSec;
      const nextStart = Math.min(
        Math.max(0, dragOrigin.value + deltaSec),
        Math.max(0, durationSec - windowSec)
      );
      startRatio.value = durationSec > 0 ? nextStart / durationSec : 0;
      endRatio.value =
        durationSec > 0 ? (nextStart + windowSec) / durationSec : 1;
    })
    .onFinalize(() => {
      dragging.value = false;
      runOnJS(onSelectionStartChange)(startRatio.value * durationSec);
    });

  // Waveform selection fill. Cropping still uses the red handles below.
  // const clipStyle = useAnimatedStyle(() => {
  //   const start = clamp01(startRatio.value);
  //   const end = Math.max(start, clamp01(endRatio.value));
  //   return {
  //     left: `${start * 100}%`,
  //     width: `${Math.max(0, end - start) * 100}%`,
  //   };
  // });
  //
  // const shiftStyle = useAnimatedStyle(() => ({
  //   width: Math.max(1, trackWidth.value),
  //   transform: [
  //     { translateX: -clamp01(startRatio.value) * trackWidth.value },
  //   ],
  // }));

  const leftHandleStyle = useAnimatedStyle(() => ({
    left: `${clamp01(startRatio.value) * 100}%`,
  }));
  const rightHandleStyle = useAnimatedStyle(() => ({
    left: `${clamp01(endRatio.value) * 100}%`,
  }));

  const selectionEndSec = Math.min(durationSec, selectionStartSec + windowSec);
  const startLabelRatio = ratio(selectionStartSec, durationSec);
  const endLabelRatio = ratio(selectionEndSec, durationSec);
  const showStartLabel = startLabelRatio > 0.12;
  const showEndLabel = endLabelRatio < 0.88 && endLabelRatio - startLabelRatio > 0.1;
  const selectedLabel = copy.selectedWindow.replace(
    "{seconds}",
    String(Math.max(1, Math.round(windowSec)))
  );

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {copy.recordedSound}
        </Text>
        <Text style={[styles.headerMeta, { color: colors.textSecondary }]}>
          {selectedLabel}
        </Text>
      </View>

      <View>
        <GestureDetector gesture={pan}>
          <View
            collapsable={false}
            style={[styles.track, { backgroundColor: trackBg }]}
            onLayout={(event) => {
              trackWidth.value = event.nativeEvent.layout.width;
            }}
          >
            <LiveSpectrogramView
              columns={columns}
              height={TRACK_HEIGHT}
              playheadCenter={false}
            />
            {/* Waveform bars
            <View style={styles.bars}>{renderBars(peaks, idleBar)}</View>
            <Animated.View style={[styles.clip, clipStyle]} pointerEvents="none">
              <Animated.View style={[styles.bars, shiftStyle]}>
                {renderBars(peaks, selectedBar)}
              </Animated.View>
            </Animated.View>
            */}
            <Animated.View
              pointerEvents="none"
              style={[styles.handle, leftHandleStyle]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.handle, rightHandleStyle]}
            />
          </View>
        </GestureDetector>
        <View pointerEvents="box-none" style={styles.playOverlay}>
          <SoundPlayButton
            isPlaying={isPlaying}
            onPress={onTogglePlay}
            size={56}
            accessibilityLabel={
              isPlaying ? "Pause selected audio" : copy.tapToPreview
            }
          />
        </View>
      </View>

      <View style={styles.times}>
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatSoundMmSs(0)}
        </Text>
        {showStartLabel ? (
          <Text
            style={[
              styles.time,
              styles.timeMark,
              { left: `${startLabelRatio * 100}%`, color: colors.primaryCTA },
            ]}
          >
            {formatSoundMmSs(selectionStartSec)}
          </Text>
        ) : null}
        {showEndLabel ? (
          <Text
            style={[
              styles.time,
              styles.timeMark,
              { left: `${endLabelRatio * 100}%`, color: colors.primaryCTA },
            ]}
          >
            {formatSoundMmSs(selectionEndSec)}
          </Text>
        ) : null}
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatSoundMmSs(durationSec)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onTogglePlay}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.hintRow}
      >
        <MaterialIcons
          name="play-circle-outline"
          size={16}
          color={colors.textTertiary}
        />
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {copy.tapToPreview}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// function renderBars(peaks: number[], color: string) {
//   return peaks.map((peak, index) => (
//     <View key={index} style={styles.barSlot}>
//       <View
//         style={[
//           styles.bar,
//           {
//             height: `${Math.round(peak * 100)}%`,
//             backgroundColor: color,
//           },
//         ]}
//       />
//     </View>
//   ));
// }

function ratio(seconds: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.min(1, Math.max(0, seconds / total));
}

function clamp01(value: number): number {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

const styles = StyleSheet.create({
  block: {
    width: "100%",
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  headerMeta: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    width: "100%",
    height: TRACK_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  bars: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 10,
    gap: 2,
  },
  barSlot: {
    flex: 1,
    height: "78%",
    justifyContent: "center",
  },
  bar: {
    width: "100%",
    borderRadius: 2,
    minHeight: 4,
  },
  clip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  handle: {
    position: "absolute",
    top: 10,
    bottom: 10,
    width: 3,
    marginLeft: -1.5,
    borderRadius: 2,
    backgroundColor: HANDLE_COLOR,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  times: {
    width: "100%",
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  timeMark: {
    position: "absolute",
    width: 48,
    marginLeft: -24,
    textAlign: "center",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 2,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
