import React from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "@react-native-community/blur";

import { APP_COLORS } from "../config/colors";
import { useTheme } from "../hooks/useTheme";

type BlurOverlayProps = {
  style?: StyleProp<ViewStyle>;
  /** Slightly stronger frosted blur when true. */
  glass?: boolean;
  /** Figma 9170:26325 — premium-gated mushroom detail sections. */
  variant?: "default" | "premiumGate";
  pointerEvents?: "none" | "auto" | "box-none" | "box-only";
};

/**
 * Frosted overlay for premium-gated content (e.g. mushroom detail sections).
 * iOS uses native UIVisualEffectView blur; Android uses BlurView with overlayColor.
 */
export function BlurOverlay({
  style,
  glass = false,
  variant = "default",
  pointerEvents = "none",
}: BlurOverlayProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const isPremiumGate = variant === "premiumGate";
  const blurAmount = isPremiumGate ? 8 : glass ? 4 : 2;

  const blurOverlayFallback = isPremiumGate
    ? isDark
      ? APP_COLORS.premiumGateBlurFallbackDark
      : APP_COLORS.blurOverlayFallback
    : isDark
      ? "rgba(17, 17, 17, 0.72)"
      : APP_COLORS.blurOverlayFallback;

  const androidOverlayColor =
    Platform.OS === "android"
      ? isPremiumGate && isDark
        ? APP_COLORS.premiumGateBlurTintDark0
        : glass || isPremiumGate
          ? blurOverlayFallback
          : undefined
      : undefined;

  return (
    <View pointerEvents={pointerEvents} style={[StyleSheet.absoluteFill, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? "dark" : "light"}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor={blurOverlayFallback}
        {...(androidOverlayColor ? { overlayColor: androidOverlayColor } : {})}
      />
      {isPremiumGate && isDark ? (
        <>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: APP_COLORS.premiumGateBlurTintDark0 },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: APP_COLORS.premiumGateBlurTintDark1 },
            ]}
          />
        </>
      ) : null}
    </View>
  );
}
