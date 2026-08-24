/**
 * Chip atom component
 */

import React from "react";
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../Text";
import { Icon } from "../Icon";

export interface ChipProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  variant?: "filled" | "outlined" | "ghost";
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "default";
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: string;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  style?: ViewStyle;
  /** Override label text color (e.g. for onboarding chips: white on CTA, brand earth on unselected) */
  labelColor?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = "filled",
  size = "medium",
  color = "default",
  selected = false,
  onPress,
  onClose,
  icon,
  iconPosition = "left",
  disabled = false,
  style,
  labelColor,
  ...props
}) => {
  const theme = useTheme();

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      alignSelf: "flex-start",
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: theme.spacing[1],
        paddingHorizontal: theme.spacing[3],
        minHeight: 24,
      },
      medium: {
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        minHeight: 32,
      },
      large: {
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[5],
        minHeight: 40,
      },
    };

    // Color mapping
    const colorMap: Record<
      string,
      { bg: string; border: string; text: string }
    > = {
      primary: {
        bg: theme.colors.primary,
        border: theme.colors.primary,
        text: theme.colors.onPrimary,
      },
      secondary: {
        bg: theme.colors.secondary,
        border: theme.colors.secondary,
        text: theme.colors.onSecondary,
      },
      success: {
        bg: theme.colors.success,
        border: theme.colors.success,
        text: theme.colors.textInverse,
      },
      warning: {
        bg: theme.colors.warning,
        border: theme.colors.warning,
        text: theme.colors.textInverse,
      },
      error: {
        bg: theme.colors.error,
        border: theme.colors.error,
        text: theme.colors.textInverse,
      },
      default: {
        bg: theme.colors.chipSelectedBg,
        border: theme.colors.border,
        text: theme.colors.chipSelectedText,
      },
    };

    const colors = colorMap[color];
    const defaultUnselectedBg =
      color === "default"
        ? theme.colors.chipUnselectedBg
        : theme.colors.surfaceVariant;

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      filled: {
        backgroundColor: selected ? colors.bg : defaultUnselectedBg,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: selected ? colors.border : theme.colors.border,
      },
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
      ...style,
    };
  };

  const getTextColor = (): string => {
    if (variant === "outlined" || variant === "ghost") {
      const colorMap: Record<string, string> = {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        success: theme.colors.success,
        warning: theme.colors.warning,
        error: theme.colors.error,
        default: theme.colors.text,
      };
      // For outlined/ghost chips, default the label to the chip color (common "pill filter" pattern)
      // unless explicitly selected state wants the same mapping.
      return color === "default"
        ? selected
          ? theme.colors.chipSelectedText
          : theme.colors.chipUnselectedText
        : colorMap[color];
    }

    if (selected) {
      const colorMap: Record<string, string> = {
        primary: theme.colors.onPrimary,
        secondary: theme.colors.onSecondary,
        success: theme.colors.textInverse,
        warning: theme.colors.textInverse,
        error: theme.colors.textInverse,
        default: theme.colors.chipSelectedText,
      };
      return colorMap[color];
    }

    return theme.colors.textSecondary;
  };

  const getIconColor = (): string => {
    return getTextColor();
  };

  const textSize =
    size === "small" ? "small" : size === "large" ? "medium" : "small";
  const iconSize = size === "small" ? 14 : size === "large" ? 18 : 16;

  const content = (
    <>
      {icon && iconPosition === "left" && (
        <Icon
          name={icon}
          size={iconSize}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      <Text
        variant="label"
        size={textSize}
        color={
          variant === "outlined" || variant === "ghost" ? undefined : undefined
        }
        weight="medium"
        style={{ color: labelColor ?? getTextColor() }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {icon && iconPosition === "right" && !onClose && (
        <Icon
          name={icon}
          size={iconSize}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      {onClose && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={iconSize - 2} color={getIconColor()} />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={getChipStyle()}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getChipStyle()}
      disabled={true}
      activeOpacity={1}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 4,
  },
  closeButton: {
    marginLeft: 4,
    padding: 2,
  },
});
