import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Images } from "../../../assets";
import { getPostAuthContentLayout } from "./postAuthContentLayout";

/** Shared screen background — 1500×3248, anchored to bottom like onboarding art. */
const COMMON_BG_ASPECT = 3248 / 1500;

/** post_onboarding background.webp is 1500×2880 — anchor to bottom like onboarding art */
const POST_AUTH_BG_ASPECT = COMMON_BG_ASPECT;

export function getPostAuthBackgroundLayout(
  windowWidth: number,
  windowHeight: number
) {
  const { isWideScreen, contentWidth } = getPostAuthContentLayout(
    windowWidth,
    windowHeight
  );
  const bgWidth = isWideScreen ? contentWidth + 40 : windowWidth;
  const bgLeft = isWideScreen ? (windowWidth - bgWidth) / 2 : 0;
  const bgHeight = Math.max(windowHeight, bgWidth * POST_AUTH_BG_ASPECT);

  return { bgWidth, bgLeft, bgHeight, isWideScreen };
}

const LOCATION_GRADIENT_TOP = "#FFFFFF";
const LOCATION_GRADIENT_BOTTOM = "#F7E6CD";

/** Post-auth onboarding, subscription, and paywall backgrounds. */
export function getPostAuthOnboardingBackground(_isDark: boolean) {
  return Images.commonBg;
}

/** Full-screen subscription / paywall background. */
export function getSubscriptionBackground(isDark: boolean) {
  return getPostAuthOnboardingBackground(isDark);
}

type PostAuthOnboardingBackgroundProps = {
  isDark: boolean;
};

export function PostAuthOnboardingBackground({
  isDark,
}: PostAuthOnboardingBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const { bgWidth, bgLeft, bgHeight } = getPostAuthBackgroundLayout(width, height);

  return (
    <AppImage
      source={getPostAuthOnboardingBackground(isDark)}
      style={[
        styles.background,
        {
          width: bgWidth,
          height: bgHeight,
          left: bgLeft,
        },
      ]}
      resizeMode="cover"
    />
  );
}

/** Location slide — full-screen cream gradient (Figma 8660:94885). */
export function PostAuthLocationBackground() {
  return (
    <LinearGradient
      colors={[LOCATION_GRADIENT_TOP, LOCATION_GRADIENT_BOTTOM]}
      locations={[0, 0.87368]}
      style={styles.background}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    bottom: 0,
    zIndex: 0,
  },
});
