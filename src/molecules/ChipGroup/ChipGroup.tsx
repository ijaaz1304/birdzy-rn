/**
 * ChipGroup molecule component
 */

import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Chip, ChipProps } from "../../atoms";

export interface ChipGroupProps {
  chips: Array<{
    id: string;
    label: string;
    selected?: boolean;
    disabled?: boolean;
    icon?: string;
    color?: ChipProps["color"];
  }>;
  onChipPress?: (id: string) => void;
  variant?: ChipProps["variant"];
  size?: ChipProps["size"];
  multiSelect?: boolean;
  direction?: "row" | "column";
  spacing?: number;
  style?: ViewStyle;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  chips,
  onChipPress,
  variant = "filled",
  size = "medium",
  multiSelect = false,
  direction = "row",
  spacing = 8,
  style,
}) => {
  const _theme = useTheme();
  const [selectedChips, setSelectedChips] = React.useState<Set<string>>(
    new Set(chips.filter((chip) => chip.selected).map((chip) => chip.id))
  );

  const handleChipPress = (id: string) => {
    if (multiSelect) {
      setSelectedChips((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      setSelectedChips(new Set([id]));
    }
    onChipPress?.(id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: direction,
          gap: spacing,
          flexWrap: direction === "row" ? "wrap" : "nowrap",
        },
        style,
      ]}
    >
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          variant={variant}
          size={size}
          color={chip.color}
          selected={selectedChips.has(chip.id)}
          disabled={chip.disabled}
          icon={chip.icon}
          onPress={() => handleChipPress(chip.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
});
