/**
 * Inline camera permission state on the identify camera screen (not a modal).
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
import { getCameraPermissionUiCopy } from "../../../services/permissions/permissionUiCopy";

export type CameraPermissionInlineVariant = "allowAccess" | "goToSettings";

const PERMISSION_TITLE_COLOR = "#FFFFFF";
const PERMISSION_DENIED_SUBTITLE_COLOR = "#D1D1D1";
const PERMISSION_SUBTITLE_FONT_SIZE = 16;

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
        <View style={styles.iconWrap}>
          <AppImage
            source={Images.speciesCapturePopup}
            style={styles.heroIcon}
            resizeMode="contain"
            preferRNImage
          />
        </View>
      ) : null}

      {isSettings ? (
        <Text
          variant="headline"
          size="medium"
          weight="semibold"
          style={[styles.title, { color: PERMISSION_TITLE_COLOR }]}
        >
          {copy.deniedTitle ?? copy.title}
        </Text>
      ) : null}

      <Text
        variant="body"
        size="medium"
        style={[
          styles.subtitle,
          !isSettings && styles.subtitleAllowAccess,
          {
            fontSize: PERMISSION_SUBTITLE_FONT_SIZE,
            lineHeight: 26,
            color: PERMISSION_DENIED_SUBTITLE_COLOR,
          },
        ]}
      >
        {isSettings ? copy.deniedSubtitle ?? copy.subtitle : copy.subtitle}
      </Text>

      <TouchableOpacity
        onPress={onAction}
        disabled={loading}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
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
  iconWrap: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
  },
  title: {
    textAlign: "center",
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  subtitleAllowAccess: {
    paddingTop: 20,
  },
  button: {
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
