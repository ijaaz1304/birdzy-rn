import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { AppImage } from "@/components/AppImage";
import { Images, SoundLibraryPlayIcon } from "../../../assets";
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
          backgroundColor: isPlaying ? "transparent" : theme.colors.primaryCTA,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (isPlaying ? "Pause sound" : "Play sound")
      }
    >
      {isPlaying ? (
        <AppImage
          source={Images.soundPause}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
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
});
