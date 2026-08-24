/**
 * Camera Permission Gate Component
 * Handles camera permission requests and displays appropriate UI.
 * Gallery pick goes through crop before continuing.
 */

import { AppImage } from "@/components/AppImage";
import React, { useEffect, useState, useRef } from "react";
import { View, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import {
  checkCameraPermission,
  requestCameraPermission,
  openDeviceSettings,
} from "../../services/permissions";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface CameraPermissionGateProps {
  onGranted: () => void;
  onCancel?: () => void;
}

const CAMERA_PERMISSION_ATTEMPT_KEY =
  SCREEN_STORAGE_KEYS.CAMERA_PERMISSION_ATTEMPT_COUNT;
const MAX_PERMISSION_ATTEMPTS_BEFORE_SETTINGS = 2;

export const CameraPermissionGate: React.FC<CameraPermissionGateProps> = ({
  onGranted,
  onCancel,
}) => {
  const theme = useTheme();
  const [status, setStatus] = useState<
    "not-determined" | "denied" | "restricted" | "authorized"
  >("not-determined");
  const [blocked, setBlocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const cancelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CAMERA_PERMISSION_ATTEMPT_KEY);
        const n = parseInt(raw ?? "0", 10);
        if (!cancelled) setAttempts(Number.isFinite(n) ? n : 0);
      } catch {
        if (!cancelled) setAttempts(0);
      }
      if (!cancelled) await checkPermission();
    })();
    return () => {
      cancelled = true;
      if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (visible && status !== "authorized") {
      analyticsService.logEvent(EVENTS.camera_permission_popup);
    }
  }, [visible, status]);

  const checkPermission = async () => {
    try {
      // Use react-native-vision-camera directly for more reliable check
      const { Camera } = require("react-native-vision-camera");
      const cameraStatus = await Camera.getCameraPermissionStatus();
      const statusStr = String(cameraStatus);

      const statusMap: Record<
        string,
        "not-determined" | "denied" | "restricted" | "authorized"
      > = {
        authorized: "authorized",
        granted: "authorized", // Vision Camera returns 'granted' when user allows
        denied: "denied",
        restricted: "restricted",
        "not-determined": "not-determined",
      };
      const mappedStatus =
        statusMap[statusStr.toLowerCase()] ||
        (statusStr === "authorized" ? "authorized" : "not-determined");
      setStatus(mappedStatus);
      if (mappedStatus === "authorized") {
        onGranted();
        setVisible(false);
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      // Fallback to permission service
      try {
        const result = await checkCameraPermission();
        setBlocked(!!result.blocked);
        if (result.granted) {
          onGranted();
          setVisible(false);
        } else {
          setStatus("not-determined");
        }
      } catch (fallbackError) {
        console.error("Fallback permission check failed:", fallbackError);
        setStatus("not-determined");
      }
    }
  };

  const requestPermission = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await requestCameraPermission();
      setBlocked(!!result.blocked);
      const statusMap: Record<
        string,
        "not-determined" | "denied" | "restricted" | "authorized"
      > = {
        authorized: "authorized",
        granted: "authorized",
        denied: "denied",
        restricted: "restricted",
        "not-determined": "not-determined",
      };
      const newStatus = statusMap[result.status] || "not-determined";
      setStatus(newStatus);

      if (result.granted || newStatus === "authorized") {
        analyticsService.logEvent(EVENTS.camera_permission_granted);
        onGranted();
        setVisible(false);
      } else {
        analyticsService.logEvent(EVENTS.camera_permission_denied);
        // Track attempts from storage so count is correct after remount (e.g. 3rd attempt after 2 denials)
        try {
          const raw = await AsyncStorage.getItem(CAMERA_PERMISSION_ATTEMPT_KEY);
          const current = parseInt(raw ?? "0", 10);
          const next = (Number.isFinite(current) ? current : 0) + 1;
          await AsyncStorage.setItem(
            CAMERA_PERMISSION_ATTEMPT_KEY,
            String(next)
          );
          setAttempts(next);
        } catch {
          // ignore
        }
        // If still not granted, re-check to update UI
        setTimeout(() => {
          checkPermission();
        }, 100);
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      // Re-check permission on error
      setTimeout(() => {
        checkPermission();
      }, 100);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenSettings = () => {
    openDeviceSettings();
  };

  const shouldSettings =
    blocked ||
    status === "restricted" ||
    status === "denied" ||
    attempts >= MAX_PERMISSION_ATTEMPTS_BEFORE_SETTINGS;

  useEffect(() => {
    if (status === "authorized" || !visible || shouldSettings) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [status, visible, shouldSettings]);

  if (status === "authorized") {
    return null;
  }

  const copy = MODAL_STRINGS.bottomSheets.cameraPermission;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
      >
        <View
          style={[
            styles.card,
            getPopupChromeStyle(theme),
            { padding: theme.spacing[6] },
          ]}
        >
          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: theme.colors.primary + "20",
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <AppImage
                source={
                  theme.mode === "dark"
                    ? Images.iconfixCameraDark
                    : Images.iconfixCamera
                }
                style={{ width: 34, height: 34 }}
                resizeMode="contain"
                preferRNImage
              />
            </View>
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={[
              styles.title,
              { color: theme.colors.text, marginTop: theme.spacing[3] },
            ]}
          >
            {shouldSettings ? copy.deniedTitle : copy.title}
          </Text>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                marginTop: theme.spacing[2],
                lineHeight: 22,
              },
            ]}
          >
            {shouldSettings ? copy.deniedSubtitle : copy.subtitle}
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.xl,
              },
            ]}
            onPress={
              shouldSettings ? handleOpenSettings : requestPermission
            }
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text
                variant="body"
                size="medium"
                weight="semibold"
                style={{ color: theme.colors.onPrimary }}
              >
                {shouldSettings ? copy.openSettings : copy.enableButton}
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
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  iconRow: {
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { textAlign: "center" },
  description: {
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 18,
    alignItems: "center",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
  },
});
