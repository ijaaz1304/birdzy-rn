/**
 * Feature Comparison Table Component
 * Displays free vs premium feature comparison. Data-driven via rows/headers.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import type { ComparisonRow } from "../../config/subscriptionConfig";

export interface FeatureComparisonTableProps {
  rows: ComparisonRow[];
  headers: { feature: string; free: string; premium: string };
  highlightPremiumColumn?: boolean;
}

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({
  rows,
  headers,
  highlightPremiumColumn = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          styles.headerRow,
          { borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.featureCell}>
          <Text
            variant="body"
            size="small"
            weight="semibold"
            color="textSecondary"
          >
            {headers.feature}
          </Text>
        </View>
        <View style={[styles.valueCell, styles.centerCell]}>
          <Text
            variant="body"
            size="small"
            weight="semibold"
            color="textSecondary"
          >
            {headers.free}
          </Text>
        </View>
        <View
          style={[
            styles.valueCell,
            styles.centerCell,
            highlightPremiumColumn && {
              backgroundColor: colors.surfaceVariant ?? colors.surfaceSecondary,
              marginHorizontal: -8,
              paddingHorizontal: 8,
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Text
            variant="body"
            size="small"
            weight="semibold"
            style={{
              color: highlightPremiumColumn
                ? colors.primary
                : colors.textSecondary,
            }}
          >
            {headers.premium}
          </Text>
        </View>
      </View>

      {rows.map((item, index) => (
        <View
          key={item.feature}
          style={[
            styles.row,
            { borderBottomColor: colors.border },
            index === rows.length - 1 && styles.lastRow,
          ]}
        >
          <View style={styles.featureCell}>
            <Text
              variant="body"
              size="small"
              style={{ color: colors.textPrimary }}
            >
              {item.feature}
            </Text>
          </View>
          <View style={[styles.valueCell, styles.centerCell]}>
            <Text variant="body" size="small" color="textSecondary">
              {item.free}
            </Text>
          </View>
          <View
            style={[
              styles.valueCell,
              styles.centerCell,
              highlightPremiumColumn && {
                backgroundColor:
                  colors.surfaceVariant ?? colors.surfaceSecondary,
                marginHorizontal: -8,
                paddingHorizontal: 8,
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Text
              variant="body"
              size="small"
              style={{
                color: highlightPremiumColumn
                  ? colors.primary
                  : colors.textSecondary,
              }}
            >
              {item.premium}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    paddingBottom: 8,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  featureCell: {
    flex: 2,
  },
  valueCell: {
    flex: 1,
  },
  centerCell: {
    alignItems: "center",
  },
});
