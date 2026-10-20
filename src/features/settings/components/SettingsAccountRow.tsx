/**
 * Account row at the top of Settings.
 * guest: rounded-square avatar + "Log in / Sign up" (Caption/12px subtitle)
 * profile: circular avatar + "My Profile" (Body/14px subtitle)
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AppImage } from "@/components/AppImage";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { useSettingsColors } from "../settingsColors";
import { SettingsIcon } from "./SettingsIcon";

export interface SettingsAccountRowProps {
  variant: "guest" | "profile";
  title: string;
  subtitle: string;
  avatarUri?: string;
  onPress: () => void;
  showBorder?: boolean;
}

export const SettingsAccountRow: React.FC<SettingsAccountRowProps> = ({
  variant,
  title,
  subtitle,
  avatarUri,
  onPress,
  showBorder = false,
}) => {
  const c = useSettingsColors();
  const isGuest = variant === "guest";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={[
        styles.row,
        showBorder && {
          borderBottomWidth: 1,
          borderBottomColor: c.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          isGuest ? styles.avatarSquare : styles.avatarCircle,
          { backgroundColor: c.cardBorder },
        ]}
      >
        {avatarUri ? (
          <AppImage source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <SettingsIcon name="user" color={isGuest ? c.text : c.label} />
        )}
      </View>
      <View style={[styles.textContent, isGuest && styles.guestTextContent]}>
        <Text numberOfLines={1} style={[styles.title, { color: c.text }]}>
          {title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            isGuest ? styles.captionSubtitle : styles.bodySubtitle,
            { color: c.muted },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <SettingsIcon name="chevronRight" color={c.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarSquare: {
    borderRadius: 12,
  },
  avatarCircle: {
    borderRadius: 20,
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  guestTextContent: { gap: 2 },
  textContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  captionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  bodySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
