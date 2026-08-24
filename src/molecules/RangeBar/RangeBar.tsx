import React from "react";
import { View, StyleSheet } from "react-native";
import { RangeBarProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";
import LinearGradient from "react-native-linear-gradient";

export const RangeBar: React.FC<RangeBarProps> = ({
  min,
  max,
  value,
  idealRange,
  unit = "",
  colors: gradientColors,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;

  // Calculate positions
  const idealStartPercentage = idealRange
    ? ((idealRange[0] - min) / (max - min)) * 100
    : 0;
  const idealEndPercentage = idealRange
    ? ((idealRange[1] - min) / (max - min)) * 100
    : 0;
  const idealWidth = idealEndPercentage - idealStartPercentage;

  // Use midpoint of ideal range if no value provided
  const valuePercentage = value
    ? ((value - min) / (max - min)) * 100
    : idealRange
    ? (((idealRange[0] + idealRange[1]) / 2 - min) / (max - min)) * 100
    : 50;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text size="small" color="textSecondary">
          {min}
          {unit}
        </Text>
        <Text size="small" color="textSecondary">
          {max}
          {unit}
        </Text>
      </View>
      <View style={[styles.barContainer, { marginTop: spacing[2] }]}>
        {/* Full gradient track */}
        <View
          style={[styles.barBackground, { backgroundColor: colors.border }]}
        >
          <LinearGradient
            colors={gradientColors ?? [UI_COLORS.SUCCESS_GREEN, UI_COLORS.ERROR_RED]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.barFill}
          />
        </View>

        {/* Ideal range highlight (dark green overlay) */}
        {idealRange && (
          <View
            style={[
              styles.idealRangeHighlight,
              {
                left: `${idealStartPercentage}%`,
                width: `${idealWidth}%`,
                backgroundColor: colors.primary,
                opacity: 0.3,
              },
            ]}
          />
        )}

        {/* Triangle indicator */}
        <View
          style={[
            styles.triangleIndicator,
            {
              left: `${Math.max(0, Math.min(100, valuePercentage))}%`,
            },
          ]}
        />
      </View>

      {/* Ideal range text */}
      {idealRange && (
        <View style={[styles.idealRangeLabel, { marginTop: spacing[2] }]}>
          <Text size="small" weight="semibold">
            {idealRange[0]}
            {unit}–{idealRange[1]}
            {unit}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barContainer: {
    position: "relative",
    height: 12,
    borderRadius: 6,
    overflow: "visible",
  },
  barBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  idealRangeHighlight: {
    position: "absolute",
    top: 0,
    height: "100%",
    borderRadius: 6,
  },
  triangleIndicator: {
    position: "absolute",
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: UI_COLORS.ARROW_DARK,
    transform: [{ translateX: -6 }],
  },
  idealRangeLabel: {
    alignItems: "center",
  },
});
