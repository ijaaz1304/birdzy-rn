/**
 * Shared camera styles
 */

import { StyleSheet } from "react-native";
export const createCameraStyles = (theme: any) =>
  StyleSheet.create({
    // Permission Gate Styles
    modal: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.colors.overlayDark,
    },
    modalContent: {
      backgroundColor: theme.colors.surfacePrimary,
      borderRadius: Radius.lg,
      padding: 24,
      width: "90%",
      maxWidth: 400,
      alignItems: "center",
    },
    title: {
      marginBottom: 12,
      textAlign: "center",
    },
    sub: {
      marginBottom: 24,
      textAlign: "center",
      lineHeight: 20,
    },
    primaryBtn: {
      width: "100%",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    primaryText: {
      color: theme.colors.onPrimary,
      fontFamily: FONTS.bold,
      fontSize: 16,
    },
    secondaryBtn: {
      width: "100%",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: Radius.md,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    secondaryText: {
      fontFamily: FONTS.bold,
      fontSize: 16,
    },

    // Camera Overlay Styles
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    frameBox: {
      width: 240,
      height: 240,
      borderWidth: 2,
      borderRadius: Radius.md,
    },

    // Camera Warnings Styles
    warning: {
      position: "absolute",
      bottom: 140,
      alignSelf: "center",
      backgroundColor:
        theme.colors.surfaceBrand2Accent ?? theme.colors.secondaryDark,
      paddingHorizontal: spacing[4],
      paddingVertical: 8,
      borderRadius: 20,
    },
    warningText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontFamily: FONTS.medium,
    },

    // Camera Screen Styles
    cameraContainer: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    captureBtn: {
      position: "absolute",
      bottom: 40,
      alignSelf: "center",
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfacePrimary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 4,
    },
    captureInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },

    // Instruction Modal Styles
    instructionModal: {
      padding: 24,
    },
    instructionTitle: {
      marginBottom: 20,
      textAlign: "center",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      marginBottom: 24,
      gap: spacing[4],
    },
    gridItem: {
      width: "30%",
      alignItems: "center",
    },

    // Crop Screen Styles
    cropContainer: {
      flex: 1,
    },
    cropImage: {
      flex: 1,
    },
    cropButton: {
      position: "absolute",
      bottom: 40,
      left: 24,
      right: 24,
      paddingVertical: spacing[4],
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cropButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
  });

// Default export for backward compatibility (uses light theme)
// Components that need theme-aware styles should use createCameraStyles directly
import { lightTheme } from "../../design-system/themes";
import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export const cameraStyles = createCameraStyles(lightTheme);
