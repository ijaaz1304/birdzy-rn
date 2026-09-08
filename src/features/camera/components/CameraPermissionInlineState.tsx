/**
 * Inline camera permission state on the identify camera screen (not a modal).
 * Figma 8567:1849 — manage camera access / allow access recovery.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { getCameraPermissionUiCopy } from "../../../services/permissions/permissionUiCopy";

export type CameraPermissionInlineVariant = "allowAccess" | "goToSettings";

const PERMISSION_TITLE_COLOR = "#FFFFFF";
const PERMISSION_DENIED_SUBTITLE_COLOR = "#D1D1D1";

/** Figma Illustration/take photo — 64×64 including shadow */
const TAKE_PHOTO_ILLUSTRATION_SIZE = 64;

type CameraPermissionInlineStateProps = {
  variant: CameraPermissionInlineVariant;
  loading?: boolean;
  onAction: () => void;
};

export const CameraPermissionInlineState: React.FC<
  CameraPermissionInlineStateProps
> = ({ variant, loading = false, onAction }) => {
  const theme = useTheme();
  const copy = getCameraPermissionUiCopy();
  const isSettings = variant === "goToSettings";

  return (
    <View style={styles.content}>
      {isSettings ? (
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <AppImage
              source={Images.cameraTakePhotoIllustration}
              style={styles.heroIcon}
              resizeMode="contain"
              preferRNImage
            />
          </View>

          <Text style={styles.title}>
            {copy.deniedTitle ?? copy.title}
          </Text>

          <Text style={styles.subtitle}>
            {copy.deniedSubtitle ?? copy.subtitle}
          </Text>
        </View>
      ) : (
        <Text style={[styles.subtitle, styles.subtitleAllowAccess]}>
          {copy.subtitle}
        </Text>
      )}

      <TouchableOpacity
        onPress={onAction}
        disabled={loading}
        activeOpacity={0.85}
        style={[
          styles.button,
          isSettings && styles.buttonSettings,
          {
            backgroundColor: isSettings
              ? theme.colors.primaryCTA
              : theme.colors.primary,
            borderRadius: theme.radius.xl,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text variant="body" size="medium" weight="medium" color="surface">
            {isSettings
              ? copy.openSettingsLabel
              : copy.allowAccessLabel ?? copy.continueLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 335,
    alignSelf: "center",
    alignItems: "stretch",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  heroIcon: {
    width: TAKE_PHOTO_ILLUSTRATION_SIZE,
    height: TAKE_PHOTO_ILLUSTRATION_SIZE,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    color: PERMISSION_TITLE_COLOR,
    textAlign: "center",
    width: "100%",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: PERMISSION_DENIED_SUBTITLE_COLOR,
    textAlign: "center",
    width: "100%",
  },
  subtitleAllowAccess: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  button: {
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonSettings: {
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    width: undefined,
    alignSelf: "stretch",
  },
});
