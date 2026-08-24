/**
 * Care Result Card Component
 * Reusable card component for displaying meter results (Water, Pot Size, Light, Disease)
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Card } from "../Card";

import { FONTS } from "../../common/typography";

export interface CareResultCardProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  warningMessage?: string;
  buttonLabel: string;
  buttonColor?: string;
  onButtonPress: () => void;
}

export const CareResultCard: React.FC<CareResultCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  status,
  statusColor,
  warningMessage,
  buttonLabel,
  buttonColor,
  onButtonPress,
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

  const cardStyle = {
    ...styles.card,
    backgroundColor: cardBackgroundColor,
    borderRadius: radius.lg,
  };

  return (
    <Card variant="elevated" padding="medium" style={cardStyle}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.contentContainer}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={styles.title}
          >
            {title}
          </Text>
          {value && (
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.value}
            >
              {value}
            </Text>
          )}
          {subtitle && (
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
          {status && (
            <Text
              variant="body"
              size="small"
              style={[
                styles.status,
                { color: statusColor || colors.textSecondary },
              ]}
            >
              {status}
            </Text>
          )}
        </View>
      </View>

      {warningMessage && (
        <View
          style={[styles.warningContainer, { borderTopColor: colors.border }]}
        >
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text
            variant="body"
            size="small"
            style={[styles.warningText, { color: colors.error }]}
          >
            {warningMessage}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: buttonColor || colors.warning,
            borderRadius: radius.md,
            marginTop: spacing[3],
          },
        ]}
        onPress={onButtonPress}
        activeOpacity={0.8}
      >
        <Text
          variant="label"
          size="medium"
          weight="semibold"
          style={{ color: colors.onPrimary }}
        >
          {buttonLabel}
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
  value: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 4,
  },
  status: {
    fontFamily: FONTS.medium,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.medium,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
