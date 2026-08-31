/**
 * Gallery Access Popup — explanatory pre-prompt before photo library access.
 */

import { AppImage } from "@/components/AppImage";
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
  requestStoragePermission,
  openDeviceSettings,
} from "../../services/permissions";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface GalleryAccessPopupProps {
  visible: boolean;
  onClose: () => void;
  /** Called when access is granted so the caller can open the gallery picker. */
  onAccessGranted: () => void;
  /** When true, show Open Settings instead of Continue. */
  photosBlocked?: boolean;
  onBlockedChange?: (blocked: boolean) => void;
}

export const GalleryAccessPopup: React.FC<GalleryAccessPopupProps> = ({
  visible,
  onClose,
  onAccessGranted,
  photosBlocked = false,
  onBlockedChange,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const copy = CAMERA_STRINGS.galleryAccess;

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  const handleContinue = async () => {
    if (photosBlocked) {
      await openDeviceSettings();
      return;
    }
    const res = await requestStoragePermission();
    if (res.granted) {
      onClose();
      InteractionManager.runAfterInteractions(() => {
        onAccessGranted();
      });
    } else {
      onBlockedChange?.(!!res.blocked);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
      <View
        style={[styles.card, getPopupChromeStyle(theme)]}
      >
        <AppImage
          source={
            isDark
              ? Images.popupStoragePermissionBgDark
              : Images.popupStoragePermissionBg
          }
          style={styles.icon}
          resizeMode="contain"
        />
        <Text
          variant="headline"
          size="medium"
          weight="bold"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {copy.title}
        </Text>
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.subtitle}
        >
          {copy.subtitle}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => void handleContinue()}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: theme.colors.primaryCTA,
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
              {photosBlocked ? copy.openSettings : copy.continue}
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
  },
  icon: {
    width: 96,
    height: 96,
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
