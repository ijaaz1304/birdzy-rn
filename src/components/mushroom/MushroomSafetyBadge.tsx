import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../atoms";
import {
  EDIBILITY_LABELS,
  TOXICITY_SEVERITY_LABELS,
} from "../../constants/mushroomOptions";
import { getMushroomSafetyTone } from "../../utils/mushroomApiMappers";

interface MushroomSafetyBadgeProps {
  edibility?: string | null;
  toxicitySeverity?: string | null;
  psychoactive?: string | null;
  compact?: boolean;
}

const TONE_COLORS = {
  safe: { bg: "#E8F5E9", text: "#2E7D32" },
  caution: { bg: "#FFF8E1", text: "#F57F17" },
  danger: { bg: "#FFEBEE", text: "#C62828" },
  neutral: { bg: "#ECEFF1", text: "#455A64" },
} as const;

export const MushroomSafetyBadge: React.FC<MushroomSafetyBadgeProps> = ({
  edibility,
  toxicitySeverity,
  psychoactive,
  compact,
}) => {
  const tone = getMushroomSafetyTone(edibility, toxicitySeverity, psychoactive);
  const colors = TONE_COLORS[tone];
  const label =
    (edibility && EDIBILITY_LABELS[edibility]) ||
    (toxicitySeverity &&
      toxicitySeverity !== "none" &&
      TOXICITY_SEVERITY_LABELS[toxicitySeverity]) ||
    (psychoactive === "yes" ? "Psychoactive" : null);

  if (!label) return null;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: colors.bg },
      ]}
    >
      <Text
        variant="body"
        size="small"
        weight="semibold"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
});
