import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../../atoms";
import { CloseIcon } from "../../../components/shared/CloseIcon";
import { formatFilterLabel } from "../../../molecules/ActiveFilterChips/ActiveFilterChips";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import type { FilterState } from "../../../organisms/FilterModal/types";
import { EXPLORE_COPY } from "../content/explore.strings";

type Props = {
  filters: FilterState;
  onRemove: (key: string, value: string) => void;
};

/**
 * Figma 8947:19120 (Tag/Filter): chips wrap onto new lines with 6px gaps;
 * 1px brand outline, 24 radius, 8/4 padding, Button/14px label + 16px close.
 */
export const ExploreFilterChips: React.FC<Props> = ({ filters, onRemove }) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const borderColor = isDark
    ? theme.colors.borderBrandInvert
    : theme.colors.borderBrand;
  const chips = Object.entries(filters).flatMap(([key, values]) =>
    (values ?? []).map((value) => ({ key, value }))
  );
  if (!chips.length) return null;
  return (
    <View style={styles.row}>
      {chips.map(({ key, value }) => {
        const label = formatFilterLabel(value);
        return (
          <TouchableOpacity
            key={`${key}:${value}`}
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.removeFilter(label)}
            onPress={() => onRemove(key, value)}
            hitSlop={4}
            style={[styles.chip, { borderColor }]}
          >
            <Text
              numberOfLines={2}
              style={[styles.label, { color: theme.colors.textPrimary }]}
            >
              {label}
            </Text>
            <CloseIcon
              variant="plain"
              size={16}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    flexShrink: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
