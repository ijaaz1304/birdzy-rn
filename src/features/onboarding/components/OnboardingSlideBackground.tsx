import { AppImage } from "@/components/AppImage";
import React, { useMemo } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";

/** Onboarding background art is 1500×3252 — anchor to bottom like phone. */
const ONBOARDING_BG_ASPECT = 3252 / 1500;

type OnboardingSlideBackgroundProps = {
  source: ImageSourcePropType;
  screenWidth: number;
  screenHeight: number;
  backgroundColor?: string;
};

/** Full-bleed onboarding background on tablet — covers the whole screen. */
export const OnboardingSlideBackground: React.FC<
  OnboardingSlideBackgroundProps
> = ({ source, screenWidth, screenHeight, backgroundColor }) => {
  const bgHeight = useMemo(
    () => Math.max(screenHeight, screenWidth * ONBOARDING_BG_ASPECT),
    [screenWidth, screenHeight]
  );

  return (
    <View style={styles.layer} pointerEvents="none">
      {backgroundColor ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor }]} />
      ) : null}
      <AppImage
        source={source}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: screenWidth,
          height: bgHeight,
        }}
        resizeMode="cover"
        fadeDuration={0}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
