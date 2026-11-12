/**
 * Inline camera permission state on the identify camera screen (not a modal).
 * Figma 8558:25313 (Allow access) / 8558:25342 → popup 8567:1849 (Go to settings).
 *
 * Layout mirrors the Figma "popup": max 335 wide, header (pt20 pb16 px20, gap 8)
 * + footer (pt16 pb20 px20) with a full-width 24-radius CTA. Width shrinks on
 * narrow screens; text scales and wraps inside the scrollable permission host.
 */

import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../../atoms";
import { CameraTakePhotoIllustrationSvg } from "../../../assets";
import { APP_COLORS } from "../../../config/colors";
import { FONTS } from "../../../common/typography";
import { getCameraPermissionUiCopy } from "../../../services/permissions/permissionUiCopy";

export type CameraPermissionInlineVariant = "allowAccess" | "goToSettings";

/** Figma popup width */
const CONTENT_MAX_WIDTH = 335;
/** Figma Illustration/take photo — 64×64 including padding */
const TAKE_PHOTO_ILLUSTRATION_SIZE = 64;

type CameraPermissionInlineStateProps = {
  variant: CameraPermissionInlineVariant;
  loading?: boolean;
  onAction: () => void;
};

export const CameraPermissionInlineState: React.FC<
  CameraPermissionInlineStateProps
> = ({ variant, loading = false, onAction }) => {
  const copy = getCameraPermissionUiCopy();
  const isSettings = variant === "goToSettings";
  const buttonLabel = isSettings
    ? copy.openSettingsLabel
    : copy.allowAccessLabel ?? copy.continueLabel;

  return (
    <View style={styles.popup}>
      <View style={styles.header}>
        {isSettings ? (
          <>
            <CameraTakePhotoIllustrationSvg
              width={TAKE_PHOTO_ILLUSTRATION_SIZE}
              height={TAKE_PHOTO_ILLUSTRATION_SIZE}
            />
            <Text style={styles.title}>{copy.deniedTitle ?? copy.title}</Text>
          </>
        ) : null}

        <Text style={styles.body}>
          {isSettings ? copy.deniedSubtitle ?? copy.subtitle : copy.subtitle}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onAction}
          disabled={loading}
          activeOpacity={0.85}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={APP_COLORS.surfaceWhite} />
          ) : (
            <Text style={styles.buttonLabel}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  popup: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  /** Title/20px/SemiBold (weight 700) */
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
    color: APP_COLORS.surfaceWhite,
    textAlign: "center",
    alignSelf: "stretch",
  },
  /** Body/16px/Regular */
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: APP_COLORS.cameraPermissionTextSecondary,
    textAlign: "center",
    alignSelf: "stretch",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: APP_COLORS.cameraPermissionCta,
  },
  /** Button/16px */
  buttonLabel: {
    flexShrink: 1,
    textAlign: "center",
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: APP_COLORS.surfaceWhite,
  },
});
