/**
 * RadioButton atom component
 * Optimized and dynamic version of AppRadioButton
 */

import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../Text";

export interface RadioButtonProps extends Omit<TouchableOpacityProps, "style"> {
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  labelPosition?: "left" | "right";
  style?: ViewStyle;
  labelStyle?: ViewStyle;
}

const SIZE_MAP = {
  small: { outer: 16, inner: 6 },
  medium: { outer: 20, inner: 8 },
  large: { outer: 24, inner: 10 },
} as const;

export const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  selected = false,
  disabled = false,
  size = "medium",
  labelPosition = "right",
  style,
  labelStyle,
  ...props
}) => {
  const theme = useTheme();
  const { outer: outerSize, inner: innerSize } = SIZE_MAP[size];

  const borderColor = disabled
    ? theme.colors.borderSecondary
    : selected
    ? theme.colors.borderBrand
    : theme.colors.borderPrimary;

  const fillColor = selected
    ? theme.colors.primary
    : disabled
    ? theme.colors.surfaceBrand
    : "transparent";

  const _labelColor = disabled
    ? theme.colors.textSecondary
    : theme.colors.textPrimary;

  const radio = (
    <View
      style={[
        styles.circle,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {selected && (
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: fillColor,
            },
          ]}
        />
      )}
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
      {radio}
      {labelPosition === "right" && labelComponent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  innerCircle: {
    // Inner circle styles
  },
  label: {
    marginLeft: 8,
  },
});
