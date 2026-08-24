/**
 * Common Layout Styles
 * Reusable layout patterns with TypeScript types
 */

import { StyleSheet, ViewStyle } from "react-native";
import { spacing } from "../../design-system/spacing";

export interface LayoutStyles {
  // Row layouts
  row: ViewStyle;
  rowBetween: ViewStyle;
  rowAround: ViewStyle;
  rowCenter: ViewStyle;

  // Column layouts
  column: ViewStyle;
  columnCenter: ViewStyle;

  // Spacing helpers
  gapSmall: ViewStyle;
  gapMedium: ViewStyle;
  gapLarge: ViewStyle;

  // Flex helpers
  flex1: ViewStyle;
  flexGrow: ViewStyle;

  // Alignment
  center: ViewStyle;
  alignCenter: ViewStyle;
  justifyCenter: ViewStyle;
  justifyBetween: ViewStyle;
  justifyAround: ViewStyle;

  // Position
  absolute: ViewStyle;
  relative: ViewStyle;

  // Full width/height
  fullWidth: ViewStyle;
  fullHeight: ViewStyle;
}

export const layoutStyles = StyleSheet.create<LayoutStyles>({
  // Row layouts
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowAround: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  // Column layouts
  column: {
    flexDirection: "column",
  },
  columnCenter: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  // Spacing helpers
  gapSmall: {
    gap: 8,
  },
  gapMedium: {
    gap: 12,
  },
  gapLarge: {
    gap: spacing[4],
  },

  // Flex helpers
  flex1: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },

  // Alignment
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  alignCenter: {
    alignItems: "center",
  },
  justifyCenter: {
    justifyContent: "center",
  },
  justifyBetween: {
    justifyContent: "space-between",
  },
  justifyAround: {
    justifyContent: "space-around",
  },

  // Position
  absolute: {
    position: "absolute",
  },
  relative: {
    position: "relative",
  },

  // Full width/height
  fullWidth: {
    width: "100%",
  },
  fullHeight: {
    height: "100%",
  },
});
