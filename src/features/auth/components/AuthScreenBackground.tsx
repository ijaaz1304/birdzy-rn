import { AppImage } from "@/components/AppImage";
import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { Images } from "../../../assets";

/** common_bg.webp — 1500×3248; anchor to bottom so bird art aligns with design */

type AuthScreenBackgroundProps = {
  isDark?: boolean;
};

export function AuthScreenBackground({
  isDark = false,
}: AuthScreenBackgroundProps) {
  return (
    <AppImage
      source={Images.commonBg}
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
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
});
