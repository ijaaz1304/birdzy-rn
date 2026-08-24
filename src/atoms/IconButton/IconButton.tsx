/**
 * IconButton atom component
 * Optimized and dynamic version of AppIconButton
 */

import React from "react";
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, ActivityIndicator } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Icon } from "../Icon";

export interface IconButtonProps extends Omit<TouchableOpacityProps, "style"> {
  icon: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "small" | "medium" | "large" | "xsmall";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  iconColor?: string;
}

const SIZE_MAP = {
  xsmall: { container: 28, icon: 16 },
  small: { container: 36, icon: 20 },
  medium: { container: 44, icon: 24 },
  large: { container: 48, icon: 24 },
} as const;

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  iconColor,
  ...props
}) => {
  const theme = useTheme();
  const { container: diameter, icon: iconSize } = SIZE_MAP[size];

  const getColors = () => {
    if (disabled || loading) {
      return {
        backgroundColor:
          variant === "ghost" || variant === "outline"
            ? "transparent"
            : theme.colors.surfaceSecondary,
        borderColor:
          variant === "secondary" ||
          variant === "ghost" ||
          variant === "outline"
            ? theme.colors.borderSecondary
            : "transparent",
        iconColor:
          variant === "ghost" || variant === "outline"
            ? theme.colors.textTertiary
            : theme.colors.textInverse,
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: theme.colors.surfaceBrand,
          borderColor: "transparent",
          iconColor: theme.colors.textInverse,
        };
      case "secondary":
        return {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.border0,
          iconColor: theme.colors.textPrimary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          iconColor: theme.colors.text,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: theme.colors.borderBrand,
          iconColor: theme.colors.textBrand,
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: "transparent",
          iconColor: theme.colors.textTertiary,
        };
    }
  };

  const {
    backgroundColor,
    borderColor,
    iconColor: defaultIconColor,
  } = getColors();
  const finalIconColor = iconColor || defaultIconColor;

  const hasBorder =
    variant === "secondary" || variant === "ghost" || variant === "outline";

  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          width: diameter,
          height: diameter,
          borderRadius: theme.radius.full,
          backgroundColor,
          borderColor,
          borderWidth: hasBorder ? 1 : 0,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={finalIconColor} />
      ) : (
        <Icon name={icon} size={iconSize} color={finalIconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
