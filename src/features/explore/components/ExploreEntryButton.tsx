import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  label: string;
  onPress: () => void;
};

/**
 * Small filled pill that opens Explore from a screen header (the "Explore Near
 * You" button next to the Catalogue title). The label comes from the caller.
 */
export const ExploreEntryButton: React.FC<Props> = ({ label, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.85}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.pill, { backgroundColor: colors.primaryCTA }]}
    >
      <Text
        variant="body"
        size="small"
        weight="medium"
        numberOfLines={1}
        style={{ color: colors.onPrimary }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
