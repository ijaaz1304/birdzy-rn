import { AppImage } from "@/components/AppImage";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../../theme/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** common_bg.webp — 1500×3248; anchor to bottom like auth/onboarding art. */
const COMMON_BG_ASPECT = 3248 / 1500;
const COMMON_BG_HEIGHT = Math.max(
  SCREEN_HEIGHT,
  SCREEN_WIDTH * COMMON_BG_ASPECT
);

export function AskAIScreenBackground() {
  return (
    <View
      style={[styles.backgroundHost, { backgroundColor: APP_COLORS.surfaceAuthLight }]}
      pointerEvents="none"
    >
      <AppImage
        source={Images.commonBg}
        style={styles.background}
        resizeMode="cover"
        preferRNImage
        fadeDuration={0}
        pointerEvents="none"
      />
    </View>
  );
}

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
    height: COMMON_BG_HEIGHT,
  },
});
