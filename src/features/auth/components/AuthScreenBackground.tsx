import { AppImage } from "@/components/AppImage";
import React from "react";
import { Dimensions, StatusBar, StyleSheet } from "react-native";
import { Images } from "../../../assets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** auth.webp / auth_bg.webp — anchor to bottom so mushrooms align with design */
const AUTH_BG_ASPECT = 3248 / 1500;
const AUTH_BG_HEIGHT = Math.max(SCREEN_HEIGHT, SCREEN_WIDTH * AUTH_BG_ASPECT);

type AuthScreenBackgroundProps = {
  isDark?: boolean;
};

export function AuthScreenBackground({ isDark = false }: AuthScreenBackgroundProps) {
  return (
    <AppImage
      source={isDark ? Images.authBgDark : Images.authScreenBg}
      style={styles.background}
      resizeMode="cover"
      pointerEvents="none"
    />
  );
}

export function AuthScreenStatusBar({ isDark }: { isDark: boolean }) {
  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle={isDark ? "light-content" : "dark-content"}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: AUTH_BG_HEIGHT,
    zIndex: 0,
  },
});
