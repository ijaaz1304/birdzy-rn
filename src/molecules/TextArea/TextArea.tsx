/**
 * TextArea molecule component
 * Optimized and dynamic version of AppTextArea
 */

import React, { useState } from "react";
import { View, TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";

import { spacing } from "../../design-system/spacing";
import {
  getBackgroundColor,
  getBorderColor,
} from "../../components/shared/fieldUtils";

export type TextAreaState =
  | "normal"
  | "focus"
  | "filled"
  | "error"
  | "success"
  | "disabled";

export interface TextAreaProps
  extends Omit<TextInputProps, "style" | "multiline"> {
  label?: string;
  /** Optional label text color override (UI-only). */
  labelTextColor?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  helperText?: string;
  state?: TextAreaState;
  disabled?: boolean;
  numberOfLines?: number;
  minHeight?: number;
  maxHeight?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  labelTextColor,
  placeholder = "",
  value,
  onChangeText,
  helperText,
  state = "normal",
  disabled = false,
  numberOfLines = 4,
  minHeight = 96,
  maxHeight,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const currentState: TextAreaState = disabled
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

  const borderColor = getBorderColor({
    currentState,
    colors: theme.colors,
  });
  const backgroundColor = getBackgroundColor(currentState, theme.colors);
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
          style={[
            styles.label,
            labelTextColor ? { color: labelTextColor } : null,
          ]}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.textArea,
          {
            color: textColor,
            backgroundColor,
            borderColor,
            minHeight,
            borderRadius: theme.textFieldBorderRadius,
            ...(maxHeight && { maxHeight }),
          },
          inputStyle,
        ]}
        multiline
        numberOfLines={numberOfLines}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        textAlignVertical="top"
        {...props}
      />

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
    flex: 1,
    width: "100%",
  },
  label: {
    marginBottom: 4,
  },
  textArea: {
    width: "100%",
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    marginTop: 4,
  },
});
