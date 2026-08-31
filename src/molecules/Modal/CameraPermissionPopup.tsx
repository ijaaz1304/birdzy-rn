/**
 * Camera permission popup — centered modal before identification.
 * Continue triggers the native OS prompt. Close dismisses the popup.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface CameraPermissionPopupProps {
  visible: boolean;
  onClose: () => void;
  onAllowCamera: () => void;
  loading?: boolean;
  /** When true, primary CTA opens device settings. */
  openSettings?: boolean;
}

export const CameraPermissionPopup: React.FC<CameraPermissionPopupProps> = ({
  visible,
  onClose,
  onAllowCamera,
  loading = false,
  openSettings = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const copy = MODAL_STRINGS.bottomSheets.cameraPermission;

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
        ]}
      >
        <View style={[styles.card, getPopupChromeStyle(theme)]}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.xl,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon
              isDark={theme.mode === "dark"}
              variant="plain"
              size={14}
            />
          </TouchableOpacity>

          <AppImage
            source={Images.mushroomCapturePopup}
            style={styles.heroIcon}
            resizeMode="contain"
            preferRNImage
          />

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {openSettings ? copy.deniedTitle : copy.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={[styles.subtitle, { marginTop: spacing[2] }]}
          >
            {openSettings ? copy.deniedSubtitle : copy.subtitle}
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primaryCTA,
                borderRadius: radius.xl,
                marginTop: spacing[4],
              },
            ]}
            onPress={onAllowCamera}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                variant="body"
                size="medium"
                weight="semibold"
                style={{ color: colors.onPrimary }}
              >
                {openSettings ? copy.openSettings : copy.enableButton}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  heroIcon: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
