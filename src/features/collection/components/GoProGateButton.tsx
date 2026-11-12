/**
 * Figma 845:303277 / 8040:62610 — gradient "Go Pro" pill on locked bird detail sections.
 *
 * Built in code (not a baked PNG/WebP) so the label is real text: it stays sharp
 * at every density, can be localised, and can't drift from the design — the old
 * `go_pro.webp` export actually read "You're Pro".
 */

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import GoProRosette from "../../../assets/collection/details/bird/go_pro_rosette.svg";
import GoProRibbon from "../../../assets/collection/details/bird/go_pro_ribbon.svg";
import { FONTS } from "../../../common/typography";

const GO_PRO_LABEL = "Go Pro";

/**
 * Figma gradient: 162.6deg, #41EDE9 7.5% → #219699 13.9% → #0F7A81 17.6% → #9E70B6 93.1%.
 * Same stops as DetailsTabPremiumBadge so the tab badge and this pill match.
 */
const GRADIENT_COLORS = ["#41EDE9", "#219699", "#0F7A81", "#9E70B6"];
const GRADIENT_LOCATIONS = [0.075, 0.139, 0.176, 0.931];

/** Figma "Plus Icon" (24×24): rosette inset 0 / 9.82% / 16.02% / 9.82%, ribbon 14.62% / 14.59% / 0 / 14.5% */
const ICON_SIZE = 24;

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
      accessibilityLabel={GO_PRO_LABEL}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        useAngle
        angle={162.6}
        style={styles.pill}
      >
        <Text style={styles.label}>{GO_PRO_LABEL}</Text>
        <View style={styles.icon} pointerEvents="none">
          <GoProRosette width={19.29} height={20.16} style={styles.rosette} />
          <GoProRibbon width={17.02} height={20.49} style={styles.ribbon} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  /** Figma Button: 16/10 padding, 8pt gap, radius 24 — hugs its content (≈44pt tall) */
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    overflow: "hidden",
  },
  /** Figma Button/16px: Satoshi Medium 16/24, text-icon-invert (white) */
  label: {
    flexShrink: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  /** 24 × 9.82% ≈ 2.36 */
  rosette: {
    position: "absolute",
    top: 0,
    left: 2.36,
  },
  /** 24 × 14.62% ≈ 3.51, 24 × 14.5% ≈ 3.48 */
  ribbon: {
    position: "absolute",
    top: 3.51,
    left: 3.48,
  },
});
