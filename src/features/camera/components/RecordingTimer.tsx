import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { APP_COLORS } from "../../../config/colors";
import { FONTS } from "../../../common/typography";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import { RECORDING_TIMER_INTERVAL_MS } from "../constants/soundRecording.constants";
import { formatSoundHms } from "../utils/soundCrop";
import { logSoundRenderCount } from "../utils/soundRecordLog";

const TIMER_PILL_COLOR = APP_COLORS.createButtonFg;

/** Isolated timer — only this subtree re-renders on tick. */
export const RecordingTimer = React.memo(function RecordingTimer() {
  logSoundRenderCount("RecordingTimer");
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const tick = () => {
      const next = Math.floor(soundIdentifyRecordingService.elapsedRecordingSeconds());
      setElapsedSec((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = setInterval(tick, RECORDING_TIMER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.timerPill, { backgroundColor: TIMER_PILL_COLOR }]}>
      <Text style={styles.timerText}>{formatSoundHms(elapsedSec)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  timerPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  timerText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: "#FFFFFF",
  },
});
