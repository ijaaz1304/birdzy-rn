/**
 * Active filter chips — matches CatalogueMain filter chip UI.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";
import { UI_COLORS } from "../../constants/colorConstants";
import { Radius } from "../../design";
import type { FilterState } from "../../organisms/FilterModal/types";

export function formatFilterLabel(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const FILTER_CHIP_BORDER_COLOR = APP_COLORS.ctaPrimary;
const FILTER_CHIP_BORDER_WIDTH = 1;
const FILTER_CHIP_RADIUS = 20;

export interface ActiveFilterChipsProps {
  filters: FilterState;
  onOpenFilters: () => void;
  onRemoveFilterValue: (filterKey: string, value: string) => void;
  resultsHeading?: string;
  contentPaddingHorizontal?: number;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onOpenFilters,
  onRemoveFilterValue,
  resultsHeading = "Results",
  contentPaddingHorizontal,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const isDark = useIsDark();
  const horizontalPadding = contentPaddingHorizontal ?? Space[4];

  const filterChipItems = useMemo(() => {
    const items: { filterKey: string; value: string; label: string }[] = [];
    Object.entries(filters).forEach(([key, values]) => {
      (values || []).forEach((value) => {
        items.push({
          filterKey: key,
          value,
          label: formatFilterLabel(value),
        });
      });
    });
    return items;
  }, [filters]);

  if (filterChipItems.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text
        variant="title"
        size="small"
        weight="bold"
        style={[
          styles.resultsHeading,
          { color: colors.textPrimary, paddingHorizontal: horizontalPadding },
        ]}
      >
        {resultsHeading}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingVertical: 6,
            marginBottom: Space[1],
            backgroundColor: colors.surfaceSecondary,
            borderRadius: Radius.sm,
          },
        ]}
        style={styles.scrollView}
      >
        {filterChipItems.map(({ filterKey, value, label }, index) => (
          <View
            key={`${filterKey}-${value}-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surfacePrimary,
                borderColor: FILTER_CHIP_BORDER_COLOR,
              },
            ]}
          >
            <TouchableOpacity
              onPress={onOpenFilters}
              activeOpacity={0.8}
              style={styles.chipLabelTouch}
            >
              <Text
                variant="label"
                size="small"
                weight="medium"
                numberOfLines={1}
                style={[styles.chipLabel, { color: colors.textPrimary }]}
              >
                {label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRemoveFilterValue(filterKey, value)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.chipClose}
              activeOpacity={0.7}
            >
              <CloseIcon
                isDark={isDark}
                variant="plain"
                size={16}
                style={styles.chipCloseIcon}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export interface FilterActionButtonProps {
  filterCount: number;
  onPress: () => void;
}

export const FilterActionButton: React.FC<FilterActionButtonProps> = ({
  filterCount,
  onPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.filterButtonWrap}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.border0,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <AppImage
          source={Images.filterIcon}
          style={[
            styles.filterButtonIcon,
            { tintColor: colors.textPrimary },
          ]}
          resizeMode="contain"
          preferRNImage
        />
        {filterCount > 0 && (
          <View
            style={[
              styles.filterButtonBadge,
              {
                backgroundColor: UI_COLORS.ERROR_RED,
                borderColor: colors.surfacePrimary,
              },
            ]}
          >
            <Text
              variant="label"
              size="small"
              style={styles.filterButtonBadgeText}
            >
              {filterCount > 99 ? "99+" : filterCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  resultsHeading: {
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    marginRight: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: FILTER_CHIP_BORDER_WIDTH,
    borderRadius: FILTER_CHIP_RADIUS,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 24,
  },
  chipLabelTouch: {
    flexShrink: 1,
    justifyContent: "center",
  },
  chipLabel: {
    flexShrink: 1,
  },
  chipClose: {
    marginLeft: 4,
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  chipCloseIcon: {
    width: 16,
    height: 16,
  },
  filterButtonWrap: {
    overflow: "visible",
    flexShrink: 0,
    paddingTop: 6,
    paddingRight: 6,
    marginTop: -6,
    marginRight: -6,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  filterButtonIcon: {
    width: 24,
    height: 24,
  },
  filterButtonBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  filterButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
