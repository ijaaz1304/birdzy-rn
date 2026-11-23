/**
 * Microphone permission popup — shown after location access on Identify by Sound.
 * Allow triggers the native OS prompt. Not Now / close dismisses without recording.
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import Svg, { Ellipse, Path } from "react-native-svg";
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
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import {
  getPopupChromeStyle,
  getPopupSecondaryCtaStyle,
  getPopupSecondaryCtaTextColor,
} from "../../design-system/modalTokens";

export interface MicrophonePermissionPopupProps {
  visible: boolean;
  onClose: () => void;
  onAllowMicrophone: () => void;
  loading?: boolean;
  /** When true, primary CTA opens device settings. */
  openSettings?: boolean;
}

export const MicrophonePermissionPopup: React.FC<
  MicrophonePermissionPopupProps
> = ({
  visible,
  onClose,
  onAllowMicrophone,
  loading = false,
  openSettings = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
  // Figma "Text & icon-Brand 1": light #785284, dark #009DA7.
  const micFill = isDark ? "#009DA7" : "#785284";
  // Figma "Surface-brand 2 Accent": light #C1D8DB, dark #072C38.
  const micShadow = isDark ? "#072C38" : "#C1D8DB";
  const radius = theme.radius;
  const copy = MODAL_STRINGS.bottomSheets.microphonePermission;

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
        <View
          style={[
            styles.card,
            getPopupChromeStyle(theme),
            {
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border0,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border0,
                borderRadius: radius["2xl"],
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon isDark={isDark} variant="plain" size={16} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.heroIcon}>
              <View style={styles.heroEllipse}>
                <Svg width={29.2947} height={17.3546} viewBox="0 0 29.2947 17.3546">
                  <Ellipse
                    cx={14.6473}
                    cy={8.67731}
                    rx={14.6473}
                    ry={8.67731}
                    fill={micShadow}
                  />
                </Svg>
              </View>
              <View style={styles.heroMic}>
                <Svg width={39} height={39} viewBox="0 0 39 39" fill="none">
                  <Path
                    fill={micFill}
                    d="M36.6609 2.33908C33.5422 -0.779617 28.4676 -0.779617 25.3489 2.33908C23.627 4.06096 22.8563 6.37901 23.0358 8.63498L10.3255 23.8467C9.44104 24.9088 9.29774 26.3402 9.86596 27.5179L8.80677 28.5771C7.80768 29.5762 7.52292 31.0077 8.06364 32.313C8.60436 33.6183 9.81789 34.4292 11.2308 34.4292H17.1403C17.7704 34.4292 18.283 34.9418 18.283 35.5719C18.283 36.2019 17.7704 36.7145 17.1403 36.7145H0V38.9999H17.1403C19.0305 38.9999 20.5684 37.4621 20.5684 35.5719C20.5684 33.6816 19.0305 32.1438 17.1403 32.1438H11.2308C10.5223 32.1438 10.2437 31.6039 10.1751 31.4384C10.1066 31.2729 9.92188 30.694 10.4228 30.1931L11.4822 29.1337C12.6794 29.7112 14.1069 29.5457 15.1548 28.6731L30.365 15.9642C32.6518 16.1463 34.9592 15.3527 36.6609 13.6511C39.7797 10.5323 39.7797 5.45778 36.6609 2.33908ZM35.0449 3.95499C36.996 5.90602 37.2381 8.92858 35.7716 11.1458L27.8542 3.22832C30.0713 1.76195 33.0939 2.00404 35.0449 3.95499ZM13.6909 26.9182C13.2428 27.2913 12.5678 27.26 12.1541 26.8467L12.1533 26.8459C11.74 26.4322 11.7086 25.7572 12.0805 25.3105L23.7441 11.3515C24.1282 12.1848 24.6631 12.9652 25.3489 13.6511C26.0348 14.3369 26.8151 14.8717 27.6485 15.2559L13.6909 26.9182ZM26.9649 12.0351C25.0139 10.0841 24.7718 7.0615 26.2382 4.84431L34.1557 12.7618C31.9478 14.2223 28.9235 13.9937 26.9649 12.0351Z"
                  />
                </Svg>
              </View>
            </View>

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
              size="large"
              color="textSecondary"
              style={styles.subtitle}
            >
              {openSettings ? copy.deniedSubtitle : copy.subtitle}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primaryCTA,
                  borderRadius: radius["2xl"],
                },
              ]}
              onPress={onAllowMicrophone}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                openSettings ? copy.openSettings : copy.enableButton
              }
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text
                  variant="body"
                  size="large"
                  weight="medium"
                  style={{ color: colors.onPrimary }}
                >
                  {openSettings ? copy.openSettings : copy.enableButton}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, getPopupSecondaryCtaStyle(theme)]}
              onPress={onClose}
              activeOpacity={0.85}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={copy.notNowButton}
            >
              <Text
                variant="body"
                size="large"
                weight="medium"
                style={{ color: getPopupSecondaryCtaTextColor(theme) }}
              >
                {copy.notNowButton}
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  header: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  footer: {
    width: "100%",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 64,
    height: 64,
  },
  heroEllipse: {
    position: "absolute",
    bottom: 0,
    left: (64 - 29.2947) / 2,
  },
  heroMic: {
    position: "absolute",
    left: (64 - 39) / 2 - 0.07,
    top: (64 - 39) / 2 - 0.07,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
