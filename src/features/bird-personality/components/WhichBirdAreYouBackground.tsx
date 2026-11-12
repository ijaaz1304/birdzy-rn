import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { useTheme, useIsDark } from "../../../hooks/useTheme";

/** which_mushroom_are_you_bg — light 1500×3248, dark 512×1109; anchor to bottom. */

export function WhichBirdAreYouBackground() {
  const theme = useTheme();
  const isDark = useIsDark();

  return (
    <View
      style={[
        styles.backgroundHost,
        { backgroundColor: theme.colors.background },
      ]}
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
    width: "100%",
    height: "100%",
  },
});
