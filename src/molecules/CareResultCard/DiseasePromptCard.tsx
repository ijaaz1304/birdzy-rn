/**
 * Disease Prompt Card Component
 * Shown BEFORE identification - prompts user to identify from a photo
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Card } from "../Card";
import { Images } from "../../assets";

import { Radius } from "../../design";

export interface DiseasePromptCardProps {
  onDiagnosePress: () => void;
}

export const DiseasePromptCard: React.FC<DiseasePromptCardProps> = ({
  onDiagnosePress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();

  // Use surfaceBrand2Light (#21190B) for dark mode background for disease cards
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
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: Radius.md,
              backgroundColor: colors.surfaceAccentGreen,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppImage
              source={Images.modalNotification}
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.contentContainer}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={styles.title}
          >
            Identification
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.description}
          >
            Tap to scan a photo and let the Identifier suggest possible matches.
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
        onPress={onDiagnosePress}
        activeOpacity={0.8}
      >
        <Text
          variant="label"
          size="medium"
          weight="semibold"
          style={{ color: colors.onPrimary }}
        >
          Identify
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
