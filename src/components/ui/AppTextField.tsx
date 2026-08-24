import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../design/theme";
import { useIsDark } from "../../hooks/useTheme";
import { Space } from "../../design";
import { CancelIconLight, CancelIconDark } from "../../assets";
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
};

const AppTextField: React.FC<Props> = ({
  label,
  placeholder = "",
  value,
  onChangeText,
  helperText,
  state = "normal",
  disabled = false,
  style,
  inputStyle,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = useIsDark();
  const [isFocused, setFocused] = useState(false);

  const showClear = !!value && !disabled;

  // Compute final state (merge focus + typing)
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

      <View
        style={[
          styles.fieldContainer,
          {
            backgroundColor: getBackgroundColor(currentState, colors),
            borderColor: getBorderColor({ currentState, colors }),
            borderRadius: theme.textFieldBorderRadius,
          },
        ]}
      >
        <TextInput
          style={[
            Typography.presets.body14,
            {
              flex: 1,
              color: textColor,
              paddingVertical: 0,
            },
            inputStyle,
          ]}
          value={value}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
        />
        {showClear && (
          <TouchableOpacity onPress={() => onChangeText?.("")}>
            {isDark ? (
              <CancelIconDark width={18} height={18} />
            ) : (
              <CancelIconLight width={18} height={18} />
            )}
          </TouchableOpacity>
        )}
      </View>

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

export default AppTextField;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 48,
    width: "100%",
    paddingHorizontal: Space.md,
  },
});
