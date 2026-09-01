/**
 * Identification disclaimer popup — Figma 8202:56156.
 * Shown on identification match details after the user picks a possible match.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { FONTS } from "../../common/typography";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface IdentificationWarningPopupProps {
  visible: boolean;
  onClose: () => void;
  onUnderstood: () => void;
}

export const IdentificationWarningPopup: React.FC<
  IdentificationWarningPopupProps
> = ({ visible, onClose, onUnderstood }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;
  const copy = MODAL_STRINGS.modals.identificationSafety;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.overlay,
            { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.card, getPopupChromeStyle(theme)]}>
              <View style={styles.header}>
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
                  <CloseIcon isDark={false} style={styles.closeIcon} />
                </TouchableOpacity>

                <AppImage
                  source={Images.identificationDisclaimer}
                  style={styles.heroIcon}
                  resizeMode="contain"
                  preferRNImage
                  accessibilityIgnoresInvertColors
                />

                <Text
                  variant="headline"
                  size="medium"
                  weight="bold"
                  style={[styles.title, { color: colors.textPrimary }]}
                >
                  {copy.title}
                </Text>

                <Text
                  variant="body"
                  size="small"
                  style={[
                    styles.subtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {copy.subtitle}
                </Text>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primaryCTA,
                      borderRadius: radius.xl,
                    },
                  ]}
                  onPress={onUnderstood}
                  activeOpacity={0.85}
                >
                  <Text
                    variant="body"
                    size="medium"
                    weight="medium"
                    style={{ color: colors.onPrimary }}
                  >
                    {copy.gotIt}
                  </Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    overflow: "hidden",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  closeIcon: {
    width: 12,
    height: 12,
  },
  heroIcon: {
    width: 64,
    height: 64,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  title: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    width: "100%",
  },
  subtitle: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    width: "100%",
    marginTop: 8,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
