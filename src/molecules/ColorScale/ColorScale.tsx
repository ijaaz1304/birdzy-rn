import React from "react";
import { View, StyleSheet } from "react-native";
import { ColorScaleProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import { useTheme } from "../../hooks/useTheme";

export const ColorScale: React.FC<ColorScaleProps> = ({
  min,
  max,
  valueRange,
  _value,
  unit = "",
  colors: customColors,
}) => {
  const theme = useTheme();
  const spacing = theme.spacing;
  const radius = theme.radius;

  // Default pH colors: red/orange (acidic) → green (neutral) → blue/purple (alkaline)
  const defaultColors = [
    "#FF0000", // Red (0-2)
    "#FF6600", // Orange (2-4)
    "#FFAA00", // Yellow-orange (4-6)
    "#88FF00", // Yellow-green (6-7)
    "#00FF00", // Green (7)
    "#00AAFF", // Light blue (7-9)
    "#0066FF", // Blue (9-11)
    "#6600FF", // Purple (11-14)
  ];

  const colors = customColors || defaultColors;
  const totalBlocks = max - min + 1;

  // Generate color for each block based on pH value
  // For soil pH (0-14), map each value directly to its corresponding color index
  const getBlockColor = (blockIndex: number): string => {
    const blockValue = min + blockIndex;

    // If we have 15 colors (for pH 0-14), map directly: pH 0 -> colors[0], pH 1 -> colors[1], ..., pH 14 -> colors[14]
    if (colors.length === 15 && min === 0 && max === 14) {
      return colors[blockIndex] || colors[colors.length - 1];
    }

    // If we have 14 colors, assume pH 1-14 and map accordingly
    if (colors.length === 14 && min === 0 && max === 14) {
      // Map pH 0 to first color, pH 1-14 to colors[1-14]
      if (blockIndex === 0) return colors[0];
      return colors[blockIndex] || colors[colors.length - 1];
    }

    // Fallback to old logic for other scales
    if (blockValue <= 3) return colors[0] || colors[colors.length - 1];
    if (blockValue <= 4) return colors[1] || colors[colors.length - 1];
    if (blockValue <= 6) return colors[2] || colors[colors.length - 1];
    if (blockValue <= 7) return colors[3] || colors[colors.length - 1];
    if (blockValue === 7) return colors[4] || colors[colors.length - 1];
    if (blockValue <= 9) return colors[5] || colors[colors.length - 1];
    if (blockValue <= 11) return colors[6] || colors[colors.length - 1];
    return colors[7] || colors[colors.length - 1];
  };

  // Check if block is in ideal range
  const isInIdealRange = (blockIndex: number): boolean => {
    if (!valueRange) return false;
    const blockValue = min + blockIndex;
    return blockValue >= valueRange[0] && blockValue <= valueRange[1];
  };

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text size="small" color="textSecondary">
          {min} {unit}
        </Text>
        <Text size="small" color="textSecondary">
          {max} {unit}
        </Text>
      </View>

      {/* Color blocks */}
      <View style={[styles.scaleContainer, { marginTop: spacing[2] }]}>
        {Array.from({ length: totalBlocks }).map((_, index) => {
          const _blockValue = min + index;
          const isIdeal = isInIdealRange(index);
          return (
            <View
              key={index}
              style={[
                styles.block,
                {
                  backgroundColor: getBlockColor(index),
                  borderRadius: radius.xs,
                  borderWidth: isIdeal ? 2 : 0,
                  borderColor: theme.colors.primary,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Number labels below scale - show all numbers 0-14 */}
      <View style={[styles.numberLabels, { marginTop: spacing[1] }]}>
        {Array.from({ length: totalBlocks }).map((_, index) => {
          const blockValue = min + index;
          return (
            <View key={index} style={styles.numberLabel}>
              <Text size="small" color="textSecondary" style={{ fontSize: 10 }}>
                {blockValue}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Ideal range label */}
      {valueRange && (
        <View style={[styles.rangeLabel, { marginTop: spacing[2] }]}>
          <View
            style={[
              styles.rangePill,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: radius.full,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
              },
            ]}
          >
            <Text size="small" weight="semibold" color="onPrimary">
              {valueRange[0]}–{valueRange[1]} {unit}
            </Text>
          </View>
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
  scaleContainer: {
    flexDirection: "row",
    gap: 2,
    width: "100%",
  },
  block: {
    flex: 1,
    height: 24,
    minWidth: 8,
  },
  rangeLabel: {
    alignItems: "center",
  },
  rangePill: {
    alignSelf: "center",
  },
  numberLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  numberLabel: {
    flex: 1,
    alignItems: "center",
    minWidth: 8,
  },
});
