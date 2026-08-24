/**
 * Light Prompt Card Component
 * Shown BEFORE light measurement - prompts user to measure light
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Card } from "../Card";

export interface LightPromptCardProps {
  onLightMeterPress: () => void;
}

export const LightPromptCard: React.FC<LightPromptCardProps> = ({
  onLightMeterPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();

  // Use surfaceBrand2Light (#21190B) for dark mode background for meter cards
  const cardBackgroundColor = isDark
    ? colors.surfaceBrand2Light
    : colors.surfacePrimary;

  return (
    <Card
      variant="elevated"
      padding="medium"
      style={[
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="light-mode" size={24} color={colors.warning} />
        </View>
        <View style={styles.contentContainer}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={styles.title}
          >
            Light level
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.description}
          >
            Use the Light Meter to scan the area and measure real-time light
            intensity.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.reminderFertilising, // Warning orange
            borderRadius: radius.md,
            marginTop: spacing[3],
          },
        ]}
        onPress={onLightMeterPress}
        activeOpacity={0.8}
      >
        <Text
          variant="label"
          size="medium"
          weight="semibold"
          style={{ color: colors.onPrimary }}
        >
          Light Meter
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    marginTop: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
