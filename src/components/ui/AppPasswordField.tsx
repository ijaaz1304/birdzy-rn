import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../../design/theme";
import { Space } from "../../design";
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

const AppPasswordField: React.FC<Props> = ({
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
  const [isFocused, setFocused] = useState(false);
  const [secure, setSecure] = useState(true);

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
          secureTextEntry={secure}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Feather
            name={secure ? "eye" : "eye-off"}
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
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

export default AppPasswordField;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 48,
    paddingHorizontal: Space.md,
    width: "100%",
  },
});
