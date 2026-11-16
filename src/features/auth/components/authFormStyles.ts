import { StyleSheet } from "react-native";
import { FONTS } from "../../../common/typography";
import { typography } from "../../../design-system/typography";
import { AUTH_BACK_BUTTON_LEFT_OFFSET } from "../constants/authFormLayout";

/**
 * Shared Figma layout for the auth form screens (Sign up with email, Verify email, Complete profile,
 * Log in, Forgot / new password). Sizes are fixed (typography, radius, spacing); containers grow.
 */
export const authFormStyles = StyleSheet.create({
  /** Page: 20pt side margins; top/bottom padding is set per screen from safe-area insets. */
  page: {
    flex: 1,
    paddingHorizontal: 20,
  },
  /** Figma Top Navigation Bar: 52pt minimum, stays fixed while the form scrolls */
  navRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: AUTH_BACK_BUTTON_LEFT_OFFSET,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  /** Title/20px/SemiBold (20/28) — page title, max 2 lines */
  title: {
    ...typography.title.small,
    fontFamily: FONTS.bold,
  },
  /** Body/14px/Regular (14/20) — subtitle under the title */
  subtitle: {
    ...typography.body.medium,
  },
  /** Body/14px/Medium (14/20) — label above a field */
  fieldLabel: {
    ...typography.body.mediumMedium,
  },
  /** Field + its label/error: 8pt apart */
  fieldGroup: {
    gap: 8,
  },
  /** Figma Textfield: 48pt minimum (grows with font size), 12pt gap to a trailing icon */
  fieldContainer: {
    minHeight: 48,
    marginTop: 0,
    gap: 12,
  },
  /** Body/16px/Regular; fills the field's height so the whole pill is tappable */
  fieldText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    letterSpacing: -0.16,
    paddingVertical: 10,
    alignSelf: "stretch",
    textAlignVertical: "center",
  },
  /** Figma Button: 44pt minimum, label wraps and the button grows */
  submit: {
    marginTop: 0,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 23.789,
  },
  /** Button/16px Medium 16/24 */
  submitLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
