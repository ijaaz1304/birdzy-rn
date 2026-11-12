import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../../theme/colors";

/** common_bg.webp — 1500×3248; anchor to bottom like auth/onboarding art. */

export function FindYourBirdBackground() {
  return (
    <View
      style={[
        styles.backgroundHost,
        { backgroundColor: APP_COLORS.surfaceAuthLight },
      ]}
      pointerEvents="none"
    >
      <AppImage
        source={Images.commonBg}
        style={styles.background}
        resizeMode="cover"
        preferRNImage
        fadeDuration={0}
      />
    </View>
  );
}

/** @deprecated Use FindYourBirdBackground */
export const FindYourMushroomBackground = FindYourBirdBackground;

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
