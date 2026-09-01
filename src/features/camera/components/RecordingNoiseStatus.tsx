import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AppImage } from "@/components/AppImage";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import { NOISE_HINT_DB_THRESHOLD } from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";

const copy = CAMERA_STRINGS.sound;

type Props = {
  rotate: Animated.AnimatedInterpolation<string>;
  processing?: boolean;
};

/** Isolated noise/listening status — updates only on threshold cross. */
export const RecordingNoiseStatus = React.memo(function RecordingNoiseStatus({
  rotate,
  processing = false,
}: Props) {
  logSoundRenderCount("RecordingNoiseStatus");
  const theme = useTheme();
  const colors = theme.colors;
  const [isNoisy, setIsNoisy] = useState(false);

  useEffect(() => {
    if (processing) return undefined;
    soundIdentifyRecordingService.setMeteringListener((db) => {
      const noisy = db > NOISE_HINT_DB_THRESHOLD;
      setIsNoisy((prev) => (prev === noisy ? prev : noisy));
    });
    return () => {
      soundIdentifyRecordingService.setMeteringListener(null);
    };
  }, [processing]);

  const statusText = processing
    ? copy.finalizingRecording
    : isNoisy
      ? copy.statusNoise
      : copy.statusListening;

  return (
    <View style={styles.statusBlock}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <AppImage
          source={Images.soundListeningSpinner}
          style={styles.spinner}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        {statusText}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  statusBlock: {
    alignItems: "center",
    gap: 8,
  },
  spinner: { width: 40, height: 40 },
  statusText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 224,
  },
});
