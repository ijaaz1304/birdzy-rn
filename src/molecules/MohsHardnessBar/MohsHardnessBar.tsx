/**
 * Mohs Hardness Bar Component
 * Visual indicator: title, large value, scale labels 1 (Very soft) – 10 (Very hard),
 * gradient bar, and triangle indicator at the value position.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";

import { FONTS } from "../../common/typography";

import { APP_COLORS } from "../../config/colors";

const MIN = 1;
const MAX = 10;

const GRADIENT_COLORS = [
  "#E53935", // red
  "#FB8C00", // orange
  "#FDD835", // yellow
  "#43A047", // green
];

export interface MohsHardnessBarProps {
  value: number | string; // 1–10 or string like "5" or "5-6"
  mhMin?: number;
  mhMax?: number;
  /** Override number color (e.g. #7BAED6) */
  numberColor?: string;
  /** Override indicator triangle color */
  indicatorColor?: string;
  /** Show "Mohs hardness" title above the value (default: false for embedding in details) */
  showTitle?: boolean;
}

export const MohsHardnessBar: React.FC<MohsHardnessBarProps> = ({
  value,
  mhMin,
  mhMax,
  numberColor,
  indicatorColor,
  showTitle = false,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const clamped = useMemo(() => {
    let numeric: number;
    if (typeof value === "string") {
      const match = value.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
      if (match) {
        const min = parseFloat(match[1]);
        const max = match[2] ? parseFloat(match[2]) : min;
        numeric =
          mhMin != null && mhMax != null
            ? (mhMin + mhMax) / 2
            : (min + max) / 2;
      } else {
        numeric = parseFloat(value) || MIN;
      }
    } else {
      numeric = mhMin != null && mhMax != null ? (mhMin + mhMax) / 2 : value;
    }
    return Math.min(Math.max(numeric, MIN), MAX);
  }, [value, mhMin, mhMax]);

  const indicatorPosition = useMemo(() => {
    const percentage = (clamped - MIN) / (MAX - MIN);
    return `${percentage * 100}%`;
  }, [clamped]);

  const valueColor =
    numberColor ??
    (isDark ? APP_COLORS.brandPrimary : APP_COLORS.brandLightBlue);
  const triangleColor =
    indicatorColor ??
    (isDark ? theme.colors.textPrimary : APP_COLORS.shadowBlack);

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Mohs hardness</Text>}

      <View style={styles.barSection}>
        <View
          style={[
            styles.valueAtIndicator,
            { left: indicatorPosition as `${number}%` },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.value, { color: valueColor }]}>{clamped}</Text>
        </View>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>1 (Very soft)</Text>
          <Text style={styles.scaleText}>10 (Very hard)</Text>
        </View>

        <View style={styles.barWrapper}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bar}
          />
          <View
            style={[
              styles.indicatorWrapper,
              { left: indicatorPosition as `${number}%` },
            ]}
          >
            <View
              style={[styles.triangle, { borderBottomColor: triangleColor }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
    width: "100%",
  },

  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 12,
    color: APP_COLORS.surfaceDark,
  },

  barSection: {
    position: "relative",
    width: "100%",
    paddingTop: 44,
  },

  valueAtIndicator: {
    position: "absolute",
    top: 0,
    width: 80,
    marginLeft: -36,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    textAlign: "center",
  },

  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 8,
  },

  scaleText: {
    fontSize: 12,
    color: APP_COLORS.textSecondaryGray,
  },

  barWrapper: {
    position: "relative",
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "visible",
  },

  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },

  indicatorWrapper: {
    position: "absolute",
    bottom: -8,
    width: 12,
    transform: [{ translateX: -6 }],
  },

  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    borderBottomColor: UI_COLORS.ARROW_DARK,
  },
});
