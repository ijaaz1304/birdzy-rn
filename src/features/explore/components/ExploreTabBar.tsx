import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../../atoms";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { EXPLORE_COLORS } from "../content/explore.colors";
import { EXPLORE_COPY } from "../content/explore.strings";
import type { ExploreTab } from "../services/explore.api.types";

type Props = {
  activeTab: ExploreTab;
  /** The number shown after each label; null shows the label alone. */
  counts: Record<ExploreTab, number | null>;
  onSelect: (tab: ExploreTab) => void;
  /** Space left and right of the whole bar. */
  horizontalMargin?: number;
};

const TABS: { id: ExploreTab; label: string }[] = [
  { id: "growingNow", label: EXPLORE_COPY.spottedNow },
  { id: "yearRound", label: EXPLORE_COPY.yearRound },
];

/**
 * Spotted Now / Year-round switch. Each tab takes half of the row with its
 * text centred, and the active tab is underlined across its whole half.
 */
export const ExploreTabBar: React.FC<Props> = ({
  activeTab,
  counts,
  onSelect,
  horizontalMargin = 0,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const activeColor = isDark ? theme.colors.textBrand : EXPLORE_COLORS.activeTab;
  const inactiveColor = isDark
    ? theme.colors.textSecondary
    : EXPLORE_COLORS.inactiveTab;

  return (
    <View style={[styles.bar, { paddingHorizontal: horizontalMargin }]}>
      {TABS.map(({ id, label }) => {
        const count = counts[id];
        const active = activeTab === id;
        return (
          <TouchableOpacity
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              styles.tab,
              active && { borderBottomColor: activeColor },
            ]}
            onPress={() => onSelect(id)}
          >
            <Text
              variant="body"
              weight={active ? "medium" : "normal"}
              style={[
                styles.label,
                { color: active ? activeColor : inactiveColor },
              ]}
            >
              {label}
              {count != null ? ` (${count})` : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: "row", paddingTop: 8, paddingBottom: 16 },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  label: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
});
