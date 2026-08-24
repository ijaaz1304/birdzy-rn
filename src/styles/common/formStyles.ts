/**
 * Common Form Styles
 * Reusable form component styles with TypeScript types
 */

import { StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface FormStyles {
  // Form container
  form: ViewStyle;
  formContent: ViewStyle;

  // Form section
  formSection: ViewStyle;
  formSectionTitle: ViewStyle;

  // Form field
  formField: ViewStyle;
  formFieldLabel: ViewStyle;
  formFieldHelper: ViewStyle;
  formFieldError: ViewStyle;

  // Input group
  inputGroup: ViewStyle;
  inputGroupHorizontal: ViewStyle;

  // Text area
  textAreaContainer: ViewStyle;
  textArea: TextStyle;

  // Image picker
  imagePicker: ViewStyle;
  imagePickerContent: ViewStyle;
  imagePickerText: ViewStyle;
  imagePreview: ViewStyle;
  imagePreviewOverlay: ViewStyle;

  // Form actions
  formActions: ViewStyle;
  formActionsSingle: ViewStyle;

  // Social login buttons
  socialLoginContainer: ViewStyle;
  socialLoginDivider: TextStyle;
}

export const formStyles = StyleSheet.create<FormStyles>({
  // Form container
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 16,
  },

  // Form section
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    marginBottom: 12,
  },

  // Form field
  formField: {
    marginBottom: 16,
  },
  formFieldLabel: {
    marginBottom: 8,
  },
  formFieldHelper: {
    marginTop: 4,
  },
  formFieldError: {
    marginTop: 4,
  },

  // Input group
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHorizontal: {
    flexDirection: "row",
    gap: 12,
  },

  // Text area
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },

  // Image picker
  imagePicker: {
    width: "100%",
    minHeight: 200,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePickerContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  imagePickerText: {
    marginTop: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imagePreviewOverlay: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },

  // Form actions
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  formActionsSingle: {
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },

  // Social login buttons
  socialLoginContainer: {
    gap: 12,
    marginBottom: 16,
  },
  socialLoginDivider: {
    textAlign: "center",
    marginVertical: 14,
  },
});
