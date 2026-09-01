import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AppImage } from "@/components/AppImage";
import { Images } from "../../../assets";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import {
  meetsMinRecordingDuration,
  RECORDING_TIMER_INTERVAL_MS,
} from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";

const copy = CAMERA_STRINGS.sound;

type Props = {
  busy: boolean;
  isRecording: boolean;
  isPaused: boolean;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
};

/** Isolated record controls — does not rerender on timer or spectrogram ticks. */
export const RecordingControls = React.memo(function RecordingControls({
  busy,
  isRecording,
  isPaused,
  onStop,
  onPause,
  onResume,
}: Props) {
  logSoundRenderCount("RecordingControls");
  const [canStop, setCanStop] = useState(false);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor(
        soundIdentifyRecordingService.elapsedRecordingSeconds()
      );
      const next = meetsMinRecordingDuration(elapsed);
      setCanStop((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = setInterval(tick, RECORDING_TIMER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.controls}>
      <TouchableOpacity
        onPress={onStop}
        disabled={busy || !canStop}
        style={[styles.stopRecordBtn, !canStop && styles.controlDisabled]}
        accessibilityLabel={copy.stopRecording}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <AppImage
            source={Images.soundRecordStop}
            style={styles.stopRecordImage}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={isPaused ? onResume : onPause}
        disabled={busy || (!isRecording && !isPaused)}
        style={styles.pauseBtn}
        accessibilityLabel={
          isPaused ? copy.resumeRecording : copy.pauseRecording
        }
      >
        <AppImage
          source={isPaused ? Images.soundPlay : Images.soundIdentifyPause}
          style={styles.pauseIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 60,
    gap: 12,
    paddingBottom: 8,
  },
  stopRecordBtn: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  stopRecordImage: {
    width: 72,
    height: 72,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  pauseBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIcon: { width: 48, height: 48 },
});
