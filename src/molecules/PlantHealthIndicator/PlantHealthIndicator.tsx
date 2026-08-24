/**
 * Health Indicator
 * Visual indicator showing status
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { useStrings } from "../../hooks/useStrings";

export type HealthStatus = "excellent" | "good" | "fair" | "poor" | "critical";

export interface PlantHealthIndicatorProps {
  status: HealthStatus;
  score?: number; // 0-100
  showScore?: boolean;
}

export const PlantHealthIndicator: React.FC<PlantHealthIndicatorProps> = ({
  status,
  score,
  showScore = true,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();

  const getDefaultScore = (status: HealthStatus): number => {
    switch (status) {
      case "excellent":
        return 90;
      case "good":
        return 75;
      case "fair":
        return 60;
      case "poor":
        return 40;
      case "critical":
        return 20;
      default:
        return 50;
    }
  };

  const getHealthConfig = () => {
    const healthStrings = strings.collection?.legacyDetailSections?.health;
    switch (status) {
      case "excellent":
        return {
          color: colors.success,
          icon: "check-circle",
          label: healthStrings?.excellent || "Excellent",
          bgColor: colors.success + "20",
        };
      case "good":
        return {
          color: colors.primary,
          icon: "check-circle-outline",
          label: healthStrings?.good || "Good",
          bgColor: colors.primary + "20",
        };
      case "fair":
        return {
          color: colors.warning,
          icon: "warning",
          label: healthStrings?.fair || "Fair",
          bgColor: colors.warning + "20",
        };
      case "poor":
        return {
          color: colors.error,
          icon: "error-outline",
          label: healthStrings?.poor || "Poor",
          bgColor: colors.error + "20",
        };
      case "critical":
        return {
          color: colors.error,
          icon: "error",
          label: healthStrings?.critical || "Critical",
          bgColor: colors.error + "20",
        };
      default:
        return {
          color: colors.textSecondary,
          icon: "help-outline",
          label: healthStrings?.unknown || "Unknown",
          bgColor: colors.surfaceVariant,
        };
    }
  };

  const config = getHealthConfig();
  const displayScore = score !== undefined ? score : getDefaultScore(status);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderRadius: radius.md,
          padding: spacing[3],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <MaterialIcons name={config.icon} size={24} color={config.color} />
          <View style={styles.textSection}>
            <Text
              variant="body"
              size="small"
              weight="semibold"
              style={{ color: config.color }}
            >
              {strings.collection?.legacyDetailSections?.health?.title ||
                "Plant Health"}
            </Text>
            <Text variant="body" size="small" color="textSecondary">
              {config.label}
            </Text>
          </View>
        </View>
        {showScore && (
          <View style={styles.scoreSection}>
            <Text
              variant="title"
              size="medium"
              weight="bold"
              style={{ color: config.color }}
            >
              {displayScore}
            </Text>
            <Text variant="body" size="small" color="textSecondary">
              /100
            </Text>
          </View>
        )}
      </View>

      {/* Health Bar */}
      <View
        style={[
          styles.healthBar,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.full,
            marginTop: spacing[2],
          },
        ]}
      >
        <View
          style={[
            styles.healthBarFill,
            {
              width: `${displayScore}%`,
              backgroundColor: config.color,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  textSection: {
    flex: 1,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  healthBar: {
    height: 8,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
  },
});
