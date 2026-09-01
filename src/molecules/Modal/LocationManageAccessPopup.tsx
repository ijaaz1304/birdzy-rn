/**
 * Manage Location Access popup — shown after 2 native permission denials.
 * Matches Figma "Go to Settings Popup" (Manage Location Access).
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import { ActivityIndicator, BackHandler, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { openDeviceSettings } from "../../services/permissions";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface LocationManageAccessPopupProps {
  visible: boolean;
  onClose: () => void;
  onGoToSettings?: () => void;
  onCustomLocation: () => void;
}

export const LocationManageAccessPopup: React.FC<
  LocationManageAccessPopupProps
> = ({ visible, onClose, onGoToSettings, onCustomLocation }) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const copy = MODAL_STRINGS.bottomSheets.locationManageAccess;
  const [openingSettings, setOpeningSettings] = React.useState(false);

  const handleGoToSettings = async () => {
    if (openingSettings) return;
    setOpeningSettings(true);
    try {
      onGoToSettings?.();
      await openDeviceSettings();
      onClose();
    } finally {
      setOpeningSettings(false);
    }
  };

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
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
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
              >
                <CloseIcon
                  isDark={theme.mode === "dark"}
                  variant="plain"
                  size={14}
                />
              </TouchableOpacity>

              <AppImage
                source={isDark ? Images.speciesSettingDark : Images.speciesSetting}
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
                {copy.title}
              </Text>

              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={[styles.subtitle, { marginTop: spacing[2] }]}
              >
                {copy.subtitle}
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
                onPress={() => void handleGoToSettings()}
                disabled={openingSettings}
                activeOpacity={0.85}
              >
                {openingSettings ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text
                    variant="body"
                    size="medium"
                    weight="semibold"
                    style={{ color: colors.onPrimary }}
                  >
                    {copy.goToSettings}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    borderRadius: radius.xl,
                    marginTop: spacing[3],
                  },
                ]}
                onPress={onCustomLocation}
                activeOpacity={0.85}
                disabled={openingSettings}
              >
                <Text variant="body" size="medium" weight="semibold">
                  {copy.customLocation}
                </Text>
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
    zIndex: 1,
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
  secondaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 44,
  },
});
