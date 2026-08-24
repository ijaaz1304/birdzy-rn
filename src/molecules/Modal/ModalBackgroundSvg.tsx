/**
 * Renders popUp 50% or 70% background for modals (PNG from Images).
 */

import { AppImageBackground } from "@/components/AppImage";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Images } from "../../assets";

export interface ModalBackgroundSvgProps {
  variant?: "50" | "70";
  dark?: boolean;
  style?: ViewStyle;
}

export const ModalBackgroundSvg: React.FC<ModalBackgroundSvgProps> = ({
  variant = "70",
  dark = false,
  style,
}) => {
  const source =
    variant === "70"
      ? dark
        ? Images.popUp70Dark
        : Images.popUp70Light
      : dark
      ? Images.popUp50Dark
      : Images.popUp50Light;
  return (
    <AppImageBackground
      source={source}
      style={[styles.wrapper, style]}
      resizeMode="cover"
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
  },
});
