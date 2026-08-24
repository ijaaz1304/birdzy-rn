import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

import { FONTS } from "../../common/typography";

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textColor?: string;
}

export const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading,
  style,
  textColor,
}: PrimaryButtonProps) => {
  const theme = useTheme();
  const bgColor = style?.backgroundColor ?? theme.colors.primary;
  const color = textColor ?? theme.colors.onPrimary;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderRadius: theme.radius.button },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || !!loading}
      activeOpacity={disabled || loading ? 1 : 0.7}
    >
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  text: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
