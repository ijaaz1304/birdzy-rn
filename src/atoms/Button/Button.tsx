/**
 * Button atom component
 */

import React from "react";
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, StyleProp, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../Text";

import { spacing } from "../../design-system/spacing";

export interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  /** Pass false to keep the label at its design size regardless of the OS font-size setting. Default true. */
  allowFontScaling?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  allowFontScaling = true,
  ...props
}) => {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.button,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        minHeight: 36,
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
      },
      medium: {
        minHeight: 44,
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[6],
      },
      large: {
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: spacing[4],
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primaryCTA,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: theme.colors.primaryCTA,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: "100%" }),
      ...(disabled && { opacity: 0.5 }),
      ...(StyleSheet.flatten(style) ?? {}),
    };
  };

  const getTextColor = (): string => {
    if (variant === "outline" || variant === "ghost") {
      return theme.colors.primaryCTA;
    }
    return theme.colors.onPrimary;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          variant="body"
          size={size === "small" ? "medium" : "large"}
          weight="semibold"
          numberOfLines={1}
          allowFontScaling={allowFontScaling}
          /* Fixed-size labels (allowFontScaling=false) keep their design size; Android ignores minimumFontScale and over-shrinks */
          adjustsFontSizeToFit={allowFontScaling}
          minimumFontScale={0.85}
          style={[{ color: getTextColor(), textAlign: "center" }, textStyle]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
