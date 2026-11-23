import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import { RECORDING_TIMER_INTERVAL_MS } from "../constants/soundRecording.constants";
import { formatSoundHms } from "../utils/soundCrop";
import { logSoundRenderCount } from "../utils/soundRecordLog";

/** Recording timer pill — teal rgba(22, 182, 180, 1) / #16B6B4, label stays white. */
const TIMER_PILL_COLOR = "rgba(22, 182, 180, 1)";

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
