/**
 * Figma 845:303277 / 8040:62610 — gradient "Go Pro" pill on locked bird detail sections.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Images } from "../../../assets";

/** Figma Button node 8040:62610 */
const GO_PRO_WIDTH = 189;
const GO_PRO_HEIGHT = 44;

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function GoProGateButton({ onPress, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.touchable, style]}
      accessibilityRole="button"
      accessibilityLabel="Go Pro"
    >
      <AppImage
        source={Images.birdGoPro}
        style={styles.image}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: GO_PRO_WIDTH,
    height: GO_PRO_HEIGHT,
  },
});
