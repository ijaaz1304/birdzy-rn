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
      <TouchableOpacity
        onPress={onBackPress ?? (() => navigation.goBack())}
        style={styles.back}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <SettingsIcon name="back" color={foreground} />
      </TouchableOpacity>
      {/* Page title: centered between the back button and an equal spacer; max 2 lines */}
      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        style={[styles.title, { color: foreground }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.back} />
    </View>
  );
};

const styles = StyleSheet.create({
  /** App bar: 52pt (minimum — grows with larger text), back · title · spacer */
  bar: {
    minHeight: 52,
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
  /** Title/18px/Bold (weight from the font file — no fontWeight, which makes Android fall back to Roboto) */
  title: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
});
