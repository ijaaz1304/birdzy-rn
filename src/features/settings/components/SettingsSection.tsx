/**
 * Settings Section Component
 * Reusable section header for settings groups.
 * Items (e.g. Rate Us, Write feedback, Enable notification) are wrapped in a card-style background.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";

import { FONTS } from "../../../common/typography";

export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.card,
          {
            // backgroundColor: colors.surface ?? colors.surfacePrimary,
            borderRadius: radius.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  /** Headings: Body/16px/SemiBold – Satoshi 700, line-height 24px */
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    marginBottom: 8,
  },
  card: {
    overflow: "hidden",
  },
});
