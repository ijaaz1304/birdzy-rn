/**
 * Common Screen Styles
 * Reusable styles for screen layouts with TypeScript types
 */

import { StyleSheet, ViewStyle } from "react-native";
import { spacing } from "../../design-system/spacing";

export interface ScreenStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  headerTitle: ViewStyle;
  content: ViewStyle;
  contentContainer: ViewStyle;
  scrollContent: ViewStyle;
  footer: ViewStyle;
}

export const screenStyles = StyleSheet.create<ScreenStyles>({
  // Safe area container
  safeArea: {
    flex: 1,
  },

  // Screen container
  container: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
  },

  // Content container
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },

  // Scroll view content
  scrollContent: {
    paddingBottom: 120,
  },

  // Footer styles
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
