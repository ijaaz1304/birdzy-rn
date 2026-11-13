/**
 * Settings Section Component
 * Heading (Body/16px/SemiBold) above a bordered card; rows are divided by
 * 1px grey/50 lines, no divider after the last row.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { useSettingsColors } from "../settingsColors";

export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => {
  const c = useSettingsColors();
  const rows = React.Children.toArray(children).filter(React.isValidElement);

  return (
    <View style={styles.section}>
      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: c.text }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.cardShadow,
          { backgroundColor: c.card, borderColor: c.cardBorder },
        ]}
      >
        <View style={styles.cardClip}>
          {rows.map((row, index) =>
            React.cloneElement(row as React.ReactElement<any>, {
              showBorder: index < rows.length - 1,
            })
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: 4,
    gap: 8,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  cardShadow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardClip: {
    borderRadius: 15,
    overflow: "hidden",
  },
});
