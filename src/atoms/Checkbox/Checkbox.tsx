/**
 * Checkbox atom component
 * Optimized and dynamic version of AppCheckbox
 */

import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../Text";
import { Icon } from "../Icon";

export interface CheckboxProps extends Omit<TouchableOpacityProps, "style"> {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  labelPosition?: "left" | "right";
  style?: ViewStyle;
  labelStyle?: ViewStyle;
}

const SIZE_MAP = {
  small: { box: 14, icon: 10 },
  medium: { box: 16, icon: 12 },
  large: { box: 20, icon: 14 },
} as const;

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked = false,
  disabled = false,
  size = "medium",
  labelPosition = "right",
  style,
  labelStyle,
  ...props
}) => {
  const theme = useTheme();
  const { box: boxSize, icon: iconSize } = SIZE_MAP[size];

  const borderColor = disabled
    ? theme.colors.borderSecondary
    : checked
    ? theme.colors.borderBrand
    : theme.colors.borderPrimary;

  const backgroundColor = disabled
    ? theme.colors.surfaceSecondary
    : checked
    ? theme.colors.surfaceBrand
    : theme.colors.surfacePrimary;

  const iconColor = checked
    ? theme.colors.surfacePrimary
    : disabled
    ? theme.colors.textSecondary
    : "transparent";

  const _labelColor = disabled
    ? theme.colors.textSecondary
    : theme.colors.textPrimary;

  const checkbox = (
    <View
      style={[
        styles.box,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: theme.radius.xs,
          borderColor,
          backgroundColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {checked && <Icon name="check" size={iconSize} color={iconColor} />}
    </View>
  );

  const labelComponent = label ? (
    <Text
      variant="body"
      size={size === "small" ? "small" : "medium"}
      color={disabled ? "textSecondary" : "text"}
      style={[styles.label, labelStyle]}
    >
      {label}
    </Text>
  ) : null;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={props.onPress}
      disabled={disabled}
      style={[styles.row, style]}
      {...props}
    >
      {labelPosition === "left" && labelComponent}
      {checkbox}
      {labelPosition === "right" && labelComponent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    marginLeft: 8,
  },
});
