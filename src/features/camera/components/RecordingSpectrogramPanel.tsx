import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import { logSoundRecord } from "../utils/soundRecordLog";
import { soundPerfRender } from "../utils/soundPerf";
import { LiveSpectrogramView } from "./LiveSpectrogramView";
import { SoundSpectrogramView } from "./SoundSpectrogramView";

type Props = {
  /** Subscribe to PCM spectrogram updates while true. */
  active: boolean;
  /** Static placeholder when native PCM module is unavailable. */
  fallback?: boolean;
};

/**
 * Self-contained spectrogram subtree — subscribes directly to the recording
 * service so parent screen state (timer, location) does not re-render on each frame.
 */
export const RecordingSpectrogramPanel = React.memo(function RecordingSpectrogramPanel({
  active,
  fallback = false,
}: Props) {
  soundPerfRender("RecordingSpectrogramPanel");
  const theme = useTheme();
  const colors = theme.colors;
  const [spectrogramVersion, setSpectrogramVersion] = useState(0);

  useEffect(() => {
    if (!active || fallback) {
      if (fallback && active) {
        logSoundRecord("spectrogram panel fallback UI");
      }
      setSpectrogramVersion(0);
      return undefined;
    }
    logSoundRecord("spectrogram panel subscribe");
    const unsubscribe = soundIdentifyRecordingService.subscribeSpectrogram(
      setSpectrogramVersion
    );
    return () => {
      logSoundRecord("spectrogram panel unsubscribe");
      unsubscribe();
    };
  }, [active, fallback]);

  const columns = useMemo(
    () => soundIdentifyRecordingService.getSpectrogramColumnsView(),
    [spectrogramVersion]
  );

  if (fallback) {
    return (
      <View style={styles.fallbackWrap} accessibilityLabel="Recording audio indicator">
        {/* Static decorative strip — not live frequency analysis. */}
        <SoundSpectrogramView playheadCenter />
        <Text style={[styles.fallbackLabel, { color: colors.textSecondary }]}>
          Recording audio…
        </Text>
        <Text style={[styles.fallbackHint, { color: colors.textSecondary }]}>
          Live frequency view unavailable on this device.
        </Text>
      </View>
    );
  }

  return <LiveSpectrogramView columns={columns} playheadCenter />;
});

const styles = StyleSheet.create({
  fallbackWrap: {
    gap: 6,
  },
  fallbackLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  fallbackHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    opacity: 0.85,
  },
});
