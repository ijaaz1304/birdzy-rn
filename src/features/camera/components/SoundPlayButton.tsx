import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SoundLibraryPlayIcon } from "../../../assets";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
};

export function SoundPlayButton({
  isPlaying,
  onPress,
  size = 40,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const iconSize = Math.round(size * 0.6);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={HIT_SLOP.SMALL}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primaryCTA,
          overflow: "hidden",
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (isPlaying ? "Pause sound" : "Play sound")
      }
    >
      {isPlaying ? (
        <View style={styles.pauseGlyph}>
          <View style={[styles.pauseBar, { height: Math.round(size * 0.35) }]} />
          <View style={[styles.pauseBar, { height: Math.round(size * 0.35) }]} />
        </View>
      ) : (
        <SoundLibraryPlayIcon
          width={iconSize}
          height={iconSize}
          color="#FFFFFF"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pauseGlyph: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  pauseBar: {
    width: 4,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
});
