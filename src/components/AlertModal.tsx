/**
 * Global alert modal – same look as DeleteAccountConfirmation (slide, optional icon, title, message, primary/secondary buttons).
 * Driven by alert.store (showAlert). Icon and primary/secondary buttons use app CTA colors (SUBSCRIPTION_COLORS).
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { useAlertStore } from "../store/alert.store";
import { APP_COLORS } from "../config/colors";
import { Icon } from "../atoms";
import { useTheme, useIsDark } from "../hooks/useTheme";
import { SUBSCRIPTION_COLORS } from "../constants/colorConstants";
import { Images } from "../assets";
import { FONTS } from "../common/typography";
import { Radius } from "../design";
import { getPopupChromeStyle } from "../design-system/modalTokens";

export const AlertModal: React.FC = () => {
  const {
    visible,
    title,
    message,
    primary,
    secondary,
    hideIcon,
    iconVariant,
    hide,
  } = useAlertStore();
  const isDark = useIsDark();
  const theme = useTheme();

  const handlePrimary = () => {
    primary.onPress?.();
    hide();
  };

  const handleSecondary = () => {
    secondary?.onPress?.();
    hide();
  };

  // Use app CTA colors throughout (same as subscription/paywall CTAs)
  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;
  const ctaText = isDark
    ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
    : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={hide}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={hide}>
        <View style={[styles.overlay, { zIndex: 9998, elevation: 9998 }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, getPopupChromeStyle(theme)]}>
              {!hideIcon &&
                (iconVariant === "success" ? (
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: APP_COLORS.modalSuccessButtonBg },
                    ]}
                  >
                    <AppImage
                      source={Images.rateUsSent}
                      style={styles.successIcon}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: ctaBg + "25" },
                    ]}
                  >
                    <Icon name="info" size={48} color={ctaBg} />
                  </View>
                ))}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{message}</Text>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: ctaBg }]}
                onPress={handlePrimary}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: ctaText }]}>
                  {primary.text}
                </Text>
              </TouchableOpacity>

              {secondary != null && (
                <TouchableOpacity
                  onPress={handleSecondary}
                  style={styles.secondaryButton}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryButtonText, { color: ctaBg }]}>
                    {secondary.text}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.overlay,
  },
  modal: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: APP_COLORS.surfaceWhite,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successIcon: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  secondaryButton: {
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});

export default AlertModal;
