import { AppImage } from "@/components/AppImage";
import React from "react";
import { Dimensions, StyleSheet, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Images } from "../../../assets";
import { getPostAuthContentLayout } from "./postAuthContentLayout";

/** Shared screen background — 1500×3248, anchored to bottom like onboarding art. */
const COMMON_BG_ASPECT = 3248 / 1500;

/** post_onboarding background.webp is 1500×2880 — anchor to bottom like onboarding art */
const POST_AUTH_BG_ASPECT = COMMON_BG_ASPECT;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SKY_HEIGHT = 320;

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

/** Figma 8327:72643 — mint sky + bird silhouettes at top of subscription paywall. */
export function PostAuthSubscriptionSkyBackground() {
  return (
    <View style={styles.skyHost} pointerEvents="none">
      <AppImage
        source={Images.askAiSkyBg}
        style={styles.skyImage}
        resizeMode="cover"
        preferRNImage
        fadeDuration={0}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(239,251,251,0.3)", "#FFFFFF"]}
        locations={[0.034, 0.655]}
        style={styles.skyTint}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(255,255,255,0)", "#FFFFFF"]}
        locations={[0, 0.691]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
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
  skyHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  skyImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SKY_HEIGHT,
    opacity: 0.8,
  },
  skyTint: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SKY_HEIGHT,
  },
  bottomFade: {
    position: "absolute",
    top: 194,
    left: 0,
    width: SCREEN_WIDTH,
    height: 236,
  },
});
