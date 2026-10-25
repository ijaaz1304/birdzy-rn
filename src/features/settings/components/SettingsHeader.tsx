/**
 * Settings top navigation bar: back arrow + centered Title/18px/Bold.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { FONTS } from "../../../common/typography";
import { SettingsIcon } from "./SettingsIcon";

export interface SettingsHeaderProps {
  title: string;
  onBackPress?: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  onBackPress,
}) => {
  const { colors, mode } = useTheme();
  const foreground = mode === "dark" ? colors.textPrimary : "#111111";
  const navigation = useNavigation();

  return (
    <View style={styles.bar}>
      <Text
        numberOfLines={1}
        style={[styles.title, { color: foreground }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <TouchableOpacity
        onPress={onBackPress ?? (() => navigation.goBack())}
        style={styles.back}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <SettingsIcon name="back" color={foreground} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  title: {
    position: "absolute",
    left: 60,
    right: 60,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 24,
  },
});
