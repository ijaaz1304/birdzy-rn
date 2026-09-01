import { AppImage } from "@/components/AppImage";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { useTheme } from "../../../hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** which_shroom_result_bg.png is 1500×3504 — anchor to bottom like intro art */
const RESULT_BG_ASPECT = 3504 / 1500;
const RESULT_BG_HEIGHT = Math.max(
  SCREEN_HEIGHT,
  SCREEN_WIDTH * RESULT_BG_ASPECT
);

type Props = {
  isDark: boolean;
};

export function WhichBirdResultBackground({ isDark }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.backgroundHost,
        { backgroundColor: theme.colors.surface },
      ]}
      pointerEvents="none"
    >
      <AppImage
        source={
          isDark ? Images.whichBirdResultBgDark : Images.whichBirdResultBg
        }
        style={styles.background}
        resizeMode="cover"
      />
    </View>
  );
}

/** @deprecated Use WhichBirdResultBackground */
export const WhichMushroomResultBackground = WhichBirdResultBackground;

const styles = StyleSheet.create({
  backgroundHost: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: RESULT_BG_HEIGHT,
    zIndex: 0,
    overflow: "hidden",
  },
  background: {
    width: "100%",
    height: "100%",
  },
});
