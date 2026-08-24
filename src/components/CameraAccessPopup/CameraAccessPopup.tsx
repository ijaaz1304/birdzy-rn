/**
 * Camera Access Popup — explanatory pre-prompt before the native camera permission dialog.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import {
  BackHandler,
  InteractionManager,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import {
  requestCameraPermission,
  openDeviceSettings,
} from "../../services/permissions";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { getPopupChromeStyle } from "../../design-system/modalTokens";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";

export interface CameraAccessPopupProps {
  visible: boolean;
  onClose: () => void;
  /** Called when the user has granted access. Caller can then open camera. */
  onAccessGranted: () => void;
  /** When true, show Open Settings instead of Continue. */
  cameraBlocked?: boolean;
  /** Callback when blocked state changes. */
  onBlockedChange?: (blocked: boolean) => void;
}

export const CameraAccessPopup: React.FC<CameraAccessPopupProps> = ({
  visible,
  onClose,
  onAccessGranted,
  cameraBlocked = false,
  onBlockedChange,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const copy = CAMERA_STRINGS.screen;

  useEffect(() => {
    if (!visible) return undefined;
    analyticsService.logEvent(EVENTS.camera_permission_popup);
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const handleContinue = async () => {
    if (cameraBlocked) {
      await openDeviceSettings();
      return;
    }
    const res = await requestCameraPermission();
    if (res.granted) {
      analyticsService.logEvent(EVENTS.camera_permission_granted);
      onClose();
      InteractionManager.runAfterInteractions(() => {
        onAccessGranted();
      });
    } else {
      analyticsService.logEvent(EVENTS.camera_permission_denied);
      onBlockedChange?.(!!res.blocked);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <View
        style={[styles.card, getPopupChromeStyle(theme)]}
      >
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeButton,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderRadius: theme.radius.xl,
            },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <CloseIcon isDark={isDark} variant="plain" size={14} />
        </TouchableOpacity>
        <AppImage
          source={Images.alertCameraIcon}
          style={styles.icon}
          resizeMode="contain"
          preferRNImage
        />
        <Text
          variant="headline"
          size="medium"
          weight="bold"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {copy.cameraAccessTitle}
        </Text>
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.subtitle}
        >
          {copy.cameraAccessMessage}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => void handleContinue()}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Text
              variant="body"
              size="medium"
              weight="semibold"
              style={{ color: theme.colors.surface }}
            >
              {cameraBlocked
                ? CAMERA_STRINGS.buttons.openSettings
                : CAMERA_STRINGS.buttons.continue}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 99990,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
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
  icon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actions: {
    marginTop: 24,
    width: "100%",
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
