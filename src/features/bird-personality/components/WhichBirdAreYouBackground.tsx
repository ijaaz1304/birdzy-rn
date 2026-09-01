import { AppImage } from "@/components/AppImage";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { useTheme, useIsDark } from "../../../hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** which_mushroom_are_you_bg — light 1500×3248, dark 512×1109; anchor to bottom. */
const WHICH_MUSHROOM_BG_ASPECT = 3248 / 1500;
const WHICH_MUSHROOM_BG_HEIGHT = Math.max(
  SCREEN_HEIGHT,
  SCREEN_WIDTH * WHICH_MUSHROOM_BG_ASPECT
);

export function WhichBirdAreYouBackground() {
  const theme = useTheme();
  const isDark = useIsDark();

  return (
    <View
      style={[styles.backgroundHost, { backgroundColor: theme.colors.background }]}
      pointerEvents="none"
    >
      <AppImage
        source={
          isDark ? Images.whichBirdResultBgDark : Images.whichBirdAreYouBg
        }
        style={styles.background}
        resizeMode="cover"
        pointerEvents="none"
      />
    </View>
  );
}

/** @deprecated Use WhichBirdAreYouBackground */
export const WhichMushroomAreYouBackground = WhichBirdAreYouBackground;

const styles = StyleSheet.create({
  backgroundHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  background: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: WHICH_MUSHROOM_BG_HEIGHT,
  },
});
