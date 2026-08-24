/**
 * Common Card Styles
 * Reusable card component styles with TypeScript types
 */

import { StyleSheet, ViewStyle } from "react-native";
import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface CardStyles {
  // Card container
  card: ViewStyle;
  cardElevated: ViewStyle;

  // Card content
  cardContent: ViewStyle;
  cardContentSmall: ViewStyle;
  cardContentLarge: ViewStyle;

  // Card header
  cardHeader: ViewStyle;
  cardHeaderLeft: ViewStyle;
  cardHeaderRight: ViewStyle;

  // Card title
  cardTitle: ViewStyle;
  cardSubtitle: ViewStyle;

  // Card actions
  cardActions: ViewStyle;
  cardActionButton: ViewStyle;

  // Grid layouts
  cardGrid: ViewStyle;
  cardGrid2Columns: ViewStyle;
}

export const cardStyles = StyleSheet.create<CardStyles>({
  // Card container
  card: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  cardElevated: {
    borderRadius: Radius.md,
    overflow: "hidden",
    // Shadow will be applied via theme
  },

  // Card content
  cardContent: {
    padding: spacing[4],
  },
  cardContentSmall: {
    padding: 12,
  },
  cardContentLarge: {
    padding: 24,
  },

  // Card header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Card title
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginTop: 4,
  },

  // Card actions
  cardActions: {
    flexDirection: "row",
    gap: spacing[4],
    marginTop: 12,
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Grid layouts
  cardGrid: {
    flex: 1,
    margin: 4,
  },
  cardGrid2Columns: {
    flex: 1,
    margin: 4,
  },
});
