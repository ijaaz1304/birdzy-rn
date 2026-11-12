import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SoundLibraryPlayIcon } from "../../../assets";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import { Radius } from "../../../design";
import { spacing } from "../../../design-system/spacing";
import { useTheme } from "../../../hooks/useTheme";
import type { BirdSoundListItem } from "../utils/birdSoundListItems";
import { formatBirdSoundDuration } from "../utils/birdSoundListItems";
import { usePlayingCountdown } from "../hooks/usePlayingCountdown";

type Props = {
  item: BirdSoundListItem;
  isPlaying: boolean;
  onPress: () => void;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
};

export function BirdSoundRow({
  item,
  isPlaying,
  onPress,
  surfaceSecondary,
  textPrimary,
  textSecondary,
}: Props) {
  const theme = useTheme();
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  const remainingSec = usePlayingCountdown(
    isPlaying,
    item.durationSec,
    item.url
  );
  const durationText = isPlaying
    ? remainingSec != null
      ? formatBirdSoundDuration(Math.max(remainingSec, 0.001))
      : item.durationLabel
    : item.durationLabel;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: surfaceSecondary,
          borderColor: theme.colors.border0 ?? SOUND_ROW_BORDER,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? strings.pauseA11y : strings.playA11y}
    >
      <View
        style={[
          styles.playButton,
          { backgroundColor: theme.colors.primaryCTA },
        ]}
      >
        {isPlaying ? (
          <View style={styles.pauseGlyph}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        ) : (
          <SoundLibraryPlayIcon width={24} height={24} color="#FFFFFF" />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: textPrimary }]}>
              {item.title}
            </Text>
            {item.isUserRecording ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{strings.myRecording}</Text>
              </View>
            ) : null}
          </View>
          {durationText ? (
            <Text style={[styles.duration, { color: textSecondary }]}>
              {durationText}
            </Text>
          ) : isPlaying ? (
            <Text style={[styles.duration, { color: textSecondary }]}>
              {strings.playing}
            </Text>
          ) : null}
        </View>
        {item.metaLine ? (
          <Text style={[styles.meta, { color: textSecondary }]}>
            {item.metaLine}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/** Figma border-0 */
const SOUND_ROW_BORDER = "#E7E7E7";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[2],
    borderRadius: Radius.md,
    minHeight: 60,
    /** Figma "Sound": 1pt border-0 (colour set at render from the theme) */
    borderWidth: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  pauseGlyph: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  pauseBar: {
    width: 4,
    height: 14,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing[1],
  },
  titleRow: {
    gap: spacing[1],
  },
  titleGroup: {
    minWidth: 0,
    alignItems: "flex-start",
    gap: spacing[1],
  },
  title: {
    alignSelf: "stretch",
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  badge: {
    backgroundColor: APP_COLORS.createButtonBg,
    borderRadius: 100,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    maxWidth: "100%",
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: APP_COLORS.createButtonFg,
  },
  duration: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 0,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
