/**
 * Close (X) icon for popups and bottom sheets.
 * Uses Feather vector icons so the close control stays visible on all themes
 * (light close_popup.png is nearly black-on-black and fails in AppImage at small sizes).
 */

import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon } from "../../atoms/Icon";

export type CloseIconVariant = "sheet" | "plain";

export type CloseIconProps = {
  isDark?: boolean;
  /** Outer touch target visual size — matches legacy 24×24 close PNGs. */
  size?: number;
  /** sheet = X inside circular badge; plain = X only (parent supplies chrome). */
  variant?: CloseIconVariant;
  /** Overrides theme-based icon color when set. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const ICON_COLOR_LIGHT = "#4A4A4A";
const ICON_COLOR_DARK = "#FFFFFF";
const CIRCLE_BG_LIGHT = "#FFFFFF";
const CIRCLE_BG_DARK = "rgba(42, 42, 42, 0.95)";

export const CloseIcon: React.FC<CloseIconProps> = ({
  isDark = false,
  size = 24,
  variant = "sheet",
  color,
  style,
}) => {
  const iconColor = color ?? (isDark ? ICON_COLOR_DARK : ICON_COLOR_LIGHT);
  // Plain: glyph must not exceed the wrapper (Math.max(16, …) caused 16px icons in 14px boxes).
  // Sheet: smaller X inside the circular badge.
  const glyphSize =
    variant === "plain"
      ? Math.min(size, Math.max(10, Math.round(size * 0.65)))
      : Math.max(16, Math.round(size * 0.62));

  if (variant === "plain") {
    return (
      <View
        style={[
          styles.plainWrap,
          { width: size, height: size },
          style,
        ]}
      >
        <Icon name="close" size={glyphSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? CIRCLE_BG_DARK : CIRCLE_BG_LIGHT,
        },
        style,
      ]}
    >
      <Icon name="close" size={glyphSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  plainWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
