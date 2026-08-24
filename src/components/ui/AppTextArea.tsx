import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../design/theme";
import { Space, Radius } from "../../design";
import { Typography } from "../../design/typography";
import { getBackgroundColor, getBorderColor, getTextColor } from "./fieldUtils";

type FieldState =
  | "normal"
  | "focus"
  | "filled"
  | "error"
  | "success"
  | "disabled";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  helperText?: string;
  state?: FieldState;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  numberOfLines?: number;
};

const AppTextArea: React.FC<Props> = ({
  label,
  placeholder = "",
  value,
  onChangeText,
  helperText,
  state = "normal",
  disabled = false,
  style,
  inputStyle,
  numberOfLines = 4,
}) => {
  const { colors } = useTheme();
  const [isFocused, setFocused] = useState(false);

  const currentState: FieldState = disabled
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

  const textColor = getTextColor(disabled, colors);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            Typography.presets.caption12,
            { color: colors.textPrimary, marginBottom: 4 },
          ]}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={[
          Typography.presets.body16,
          styles.textArea,
          {
            color: textColor,
            backgroundColor: getBackgroundColor(currentState, colors),
            borderColor: getBorderColor({ currentState, colors }),
          },
          inputStyle,
        ]}
        multiline
        numberOfLines={numberOfLines}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
      />

      {helperText && (
        <Text
          style={[
            Typography.presets.caption12,
            {
              marginTop: 4,
              color:
                currentState === "error"
                  ? colors.textError
                  : currentState === "success"
                  ? colors.textSuccess
                  : colors.textSecondary,
            },
          ]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

export default AppTextArea;

const styles = StyleSheet.create({
  container: {
    flex: 1, // ✅ ensures it expands within its parent
  },
  textArea: {
    flex: 1,
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius.md, // ✅ instead of pill radius
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    minHeight: 96,
    textAlignVertical: "top",
  },
});
