/**
 * Tab molecule component
 * Optimized and dynamic version of AppTab
 */

import React from "react";
import { FONTS } from "../../common/typography";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";

import { spacing } from "../../design-system/spacing";

export interface TabProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  active?: boolean;
  variant?: "default" | "underline" | "pill";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
  /** Underline color (underline variant). Defaults to theme primary accent. */
  underlineColor?: string;
}

const TabComponent: React.FC<TabProps> = ({
  label,
  active = false,
  variant = "underline",
  size = "medium",
  style,
  activeColor,
  inactiveColor,
  underlineColor,
  ...props
}) => {
  const theme = useTheme();

  const textColor = active
    ? activeColor || theme.colors.primary
    : inactiveColor || theme.colors.textSecondary;

  const getVariantStyle = () => {
    switch (variant) {
      case "underline":
        return {
          borderBottomWidth: 2,
          borderBottomColor: active
            ? underlineColor || theme.colors.primary
            : "transparent",
        };
      case "pill":
        return {
          backgroundColor: active ? theme.colors.surfaceBrand : "transparent",
          borderRadius: theme.radius.full,
        };
      default:
        return {};
    }
  };

  const sizeStyles = {
    small: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 28 },
    medium: {
      paddingVertical: 8,
      paddingHorizontal: spacing[4],
      minHeight: 36,
    },
    large: { paddingVertical: 10, paddingHorizontal: 20, minHeight: 40 },
  };

  const textSize = size === "small" ? "small" : "medium";
  /** Figma tab-atom Body/14px: 14/20 (small stays 12/16) */
  const lineHeight = textSize === "small" ? 16 : 20;

  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.8}
      style={[styles.tab, sizeStyles[size], getVariantStyle(), style]}
      {...props}
    >
      <Text
        variant="body"
        size={textSize}
        color={active ? "primary" : "textSecondary"}
        weight="normal"
        /* Figma tab-atom: active = Medium (brand), inactive = Regular (secondary) */
        style={[
          {
            color: textColor,
            lineHeight,
            fontFamily: active ? FONTS.medium : FONTS.regular,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const Tab = React.memo(TabComponent);

const styles = StyleSheet.create({
  tab: {
    justifyContent: "center",
    alignItems: "center",
  },
});
