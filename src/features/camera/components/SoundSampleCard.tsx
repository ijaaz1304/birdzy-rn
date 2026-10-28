import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { Radius } from "../../../design";
import { useIsDark, useTheme } from "../../../hooks/useTheme";
import { formatSoundClipLabel } from "../utils/soundCrop";
import { SoundPlayButton } from "./SoundPlayButton";
import { SoundSpectrogramView } from "./SoundSpectrogramView";
import { usePlayingCountdown, usePlaybackPlayhead } from "../../collection/hooks/usePlayingCountdown";

type Props = {
  durationSec: number;
  stamp: string;
  place: string;
  birdCount: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** Recording being played, so the playhead ignores other clips. */
  audioUri?: string;
};

const copy = CAMERA_STRINGS.sound;

export function SoundSampleCard({
  durationSec,
  stamp,
  place,
  birdCount,
  isPlaying,
  onTogglePlay,
  audioUri,
}: Props) {
  const theme = useTheme();
  const isDark = useIsDark();
  const cardBg = isDark ? theme.colors.surfacePrimary : APP_COLORS.surfaceWhite;
  const cardBorder = isDark ? theme.colors.border0 : APP_COLORS.borderLight;
  const birdsLabel = copy.birdsCount.replace("{count}", String(birdCount));
  const remainingSec = usePlayingCountdown(isPlaying, durationSec, audioUri);
  const shownSec = isPlaying ? remainingSec ?? durationSec : durationSec;
  const playheadRatio = usePlaybackPlayhead(isPlaying, durationSec, audioUri);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <SoundSpectrogramView height={88} playheadRatio={playheadRatio} />
      <View style={styles.row}>
        <SoundPlayButton isPlaying={isPlaying} onPress={onTogglePlay} />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {copy.sampleTitle}
            </Text>
            <Text style={[styles.duration, { color: theme.colors.textPrimary }]}>
              {formatSoundClipLabel(shownSec).replace(/s$/, "")}
            </Text>
          </View>
          <Text
            style={[styles.meta, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {stamp}  •  {place}  •  {birdsLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
    padding: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  duration: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
