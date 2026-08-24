/**
 * PasswordField molecule component
 * Optimized and dynamic version of AppPasswordField
 */

import React, { useState } from "react";
import { View, TextInput, TextInputProps, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

import { spacing } from "../../design-system/spacing";

export type PasswordFieldState =
  | "normal"
  | "focus"
  | "filled"
  | "error"
  | "success"
  | "disabled";

export interface PasswordFieldProps
  extends Omit<TextInputProps, "style" | "secureTextEntry"> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  helperText?: string;
  state?: PasswordFieldState;
  disabled?: boolean;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const getBorderColor = (state: PasswordFieldState, theme: any): string => {
  switch (state) {
    case "focus":
      return theme.colors.borderBrand;
    case "error":
      return theme.colors.borderError;
    case "success":
      return theme.colors.borderSuccess;
    case "disabled":
      return "transparent";
    default:
      return theme.colors.border0;
  }
};

const getBackgroundColor = (state: PasswordFieldState, theme: any): string => {
  return state === "disabled"
    ? theme.colors.surfaceSecondary
    : theme.colors.surfacePrimary;
};

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  placeholder = "",
  value,
  onChangeText,
  helperText,
  state = "normal",
  disabled = false,
  showPasswordToggle = true,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const currentState: PasswordFieldState = disabled
    ? "disabled"
    : state === "error"
    ? "error"
    : state === "success"
    ? "success"
    : isFocused
    ? "focus"
    : value
    ? "filled"
    : "normal";

  const borderColor = getBorderColor(currentState, theme);
  const backgroundColor = getBackgroundColor(currentState, theme);
  const textColor = disabled
    ? theme.colors.textTertiary
    : theme.colors.textPrimary;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="label"
          size="medium"
          color={state === "error" ? "error" : "text"}
          weight="medium"
          style={styles.label}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.fieldContainer,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
            },
            inputStyle,
          ]}
          value={value}
          secureTextEntry={!isPasswordVisible}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.toggleButton}
          >
            <Icon
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={18}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {helperText && (
        <Text
          variant="body"
          size="small"
          color={state === "error" ? "error" : "textSecondary"}
          style={styles.helperText}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: 4,
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999, // Full rounded
    height: 48,
    paddingHorizontal: spacing[4],
    width: "100%",
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  helperText: {
    marginTop: 4,
  },
});
