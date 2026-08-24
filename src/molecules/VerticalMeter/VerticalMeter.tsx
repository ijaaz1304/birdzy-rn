import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../atoms/Text";
import { useTheme } from "../../hooks/useTheme";
import { COLORS } from "../../design-system/colors";

import { Radius } from "../../design";

export interface VerticalMeterProps {
  minLabel: string;
  maxLabel: string;
  value: number; // numeric humidity value (0–100)
  idealRange?: [number, number];
}

export const VerticalMeter: React.FC<VerticalMeterProps> = ({
  minLabel,
  maxLabel,
  value,
  idealRange,
}) => {
  const _theme = useTheme();

  const fillHeight = Math.max(0, Math.min(100, value));

  const getColor = () => {
    // Using brand color for meter fill - can be customized based on value ranges
    return COLORS.primitives.brand1.light2.hex; // #FDBE62 — brand orange
  };

  const fillColor = getColor();

  return (
    <View style={styles.wrapper}>
      {/* Glow */}
      <View
        style={[styles.glow, { backgroundColor: fillColor, opacity: 0.25 }]}
      />

      {/* Tube */}
      <View style={styles.tube}>
        <View
          style={[
            styles.fill,
            {
              height: `${fillHeight}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>

      {/* Knob */}
      <View style={styles.knobWrapper}>
        <View style={[styles.knobOuter, { borderColor: fillColor }]}>
          <View style={[styles.knobInner, { backgroundColor: fillColor }]} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text size="small" color="textSecondary">
          {minLabel}
        </Text>

        {idealRange && (
          <Text size="small" weight="semibold" color="success">
            {idealRange[0]}–{idealRange[1]}%
          </Text>
        )}

        <Text size="small" color="textSecondary">
          {maxLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    position: "relative",
    paddingVertical: 0,
    marginVertical: 0,
  },

  glow: {
    position: "absolute",
    width: 20,
    height: 80,
    borderRadius: 20,
    top: 0,
    filter: "blur(16px)", // ignored on RN Android, safe
  },

  tube: {
    width: 7,
    height: 80,
    backgroundColor: COLORS.primitives.grey[200].hex,
    borderRadius: 7,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  fill: {
    width: "100%",
    borderRadius: 7,
  },

  knobWrapper: {
    marginTop: -6,
  },

  knobOuter: {
    width: 16,
    height: 16,
    borderRadius: Radius.lg,
    borderWidth: 4,
    backgroundColor: COLORS.primitives.grey.white.hex,
    alignItems: "center",
    justifyContent: "center",
  },

  knobInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  labels: {
    marginTop: 6,
    alignItems: "center",
    gap: 2,
  },
});
