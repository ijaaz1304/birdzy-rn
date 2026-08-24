import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useIsDark } from "../../hooks/useTheme";
import { CancelIconLight, CancelIconDark } from "../../assets";
import { Space, Typography } from "../../design";
import {
  getBorderColor,
  getBackgroundColor,
  getTextColor,
  FieldState,
} from "./fieldUtils";
import Feather from "@react-native-vector-icons/feather";

type Props = {
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPressFilter?: () => void;
  disabled?: boolean;
  state?: FieldState;
  style?: ViewStyle;
  inputStyle?: TextStyle;
};

const AppSearchBar: React.FC<Props> = ({
  placeholder = "Search",
  value,
  onChangeText,
  onPressFilter,
  disabled = false,
  state = "normal",
  style,
  inputStyle,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = useIsDark();
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

  const borderColor = getBorderColor({ currentState, colors });
  const backgroundColor = getBackgroundColor(currentState, colors);
  const textColor = getTextColor(disabled, colors);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
          borderRadius: theme.textFieldBorderRadius,
          opacity: disabled ? 0.6 : 1,
          width: "100%",
        },
        style,
      ]}
    >
      {/* Left: Search Icon */}
      <Feather
        name="search"
        size={24}
        color={colors.textTertiary}
        style={{ marginRight: Space.sm }}
      />

      {/* Input */}
      <TextInput
        style={[
          Typography.presets.body14,
          {
            flex: 1,
            paddingVertical: 0,
            color: textColor,
          },
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        editable={!disabled}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {/* Right: Clear or Filter Icon */}
      {value?.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText?.("")}
          style={{ marginLeft: Space.sm }}
        >
          {isDark ? (
            <CancelIconDark width={24} height={24} />
          ) : (
            <CancelIconLight width={24} height={24} />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onPressFilter}>
          <Feather
            name="filter"
            size={24}
            color={colors.textTertiary}
            style={{ marginLeft: Space.sm }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AppSearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: Space.md,
    height: 48,
    width: "100%",
  },
});
